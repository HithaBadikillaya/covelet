/**
 * notificationService.js
 * 
 * Consolidated Notification Service for Covelet.
 * Handles:
 * 1. Firebase Admin Initialization via Base64
 * 2. Mega-Trigger Cron (/api/notifications/process-all-triggers) - Runs every 15m
 *    - Logic A: Process unlocked Time Capsules
 *    - Logic B: Process Inactive Users (7+ days)
 * 3. Functional Trigger (Immediate Reply Alert)
 */

const admin = require('firebase-admin');
const express = require('express');

// ─── 1. FIREBASE ADMIN INITIALIZATION ────────────────────────────────────────

function initializeNotificationService() {
  if (admin.apps.length > 0) return;

  const base64Account = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!base64Account) {
    console.error("❌ [Init] FIREBASE_SERVICE_ACCOUNT_BASE64 is missing.");
    return;
  }

  try {
    const decoded = Buffer.from(base64Account, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(decoded);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("🚀 [NotificationService] Firebase initialized successfully.");
  } catch (error) {
    console.error("❌ [NotificationService] Init error:", error.message);
  }
}

initializeNotificationService();

const db = admin.firestore();
const router = express.Router();

// ─── HELPERS: TOKEN FETCH & CLEANUP ─────────────────────────────────────────

async function getUserTokens(userId) {
  const snapshot = await db.collection('users').doc(userId).collection('devices').get();
  return snapshot.docs.map(d => d.data().fcmToken).filter(t => !!t);
}

async function removeDeadTokens(userId, invalidTokens) {
  if (invalidTokens.length === 0) return;
  const devicesRef = db.collection('users').doc(userId).collection('devices');
  const snapshot = await devicesRef.where('fcmToken', 'in', invalidTokens).get();
  
  const batch = db.batch();
  snapshot.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`🧹 [Cleanup] Removed ${snapshot.size} dead tokens for user ${userId}.`);
}

// ─── 2. THE MEGA-TRIGGER ROUTE (EVERY 15 MINUTES) ───────────────────────────

router.get('/process-all-triggers', async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;
  const incomingKey = req.headers['x-cron-key'];

  if (!cronSecret || incomingKey !== cronSecret) {
    console.warn("⚠️ [Cron] Unauthorized access attempt.");
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log("🛠️ [Cron] Starting 15-minute sweep sequence...");
  const now = admin.firestore.Timestamp.now();

  try {
    // ─── LOGIC A: TIME CAPSULES ──────────────────────────────────────────────
    console.log("📦 [Sweep] Checking for unlocked Time Capsules...");
    const lockedCapsules = await db.collectionGroup('timeCapsules')
      .where('status', '==', 'locked')
      .where('unlockAt', '<=', now)
      .get();

    let capsulesOpened = 0;
    for (const capsuleDoc of lockedCapsules.docs) {
      const capsuleData = capsuleDoc.data();
      const coveRef = capsuleDoc.ref.parent.parent;
      if (!coveRef) continue;

      const coveId = coveRef.id;
      const coveSnap = await coveRef.get();
      const coveName = coveSnap.data()?.name || "Your Cove";

      // Fetch member IDs
      const membersSnapshot = await coveRef.collection('members').get();
      const memberIds = membersSnapshot.docs.map(d => d.id);

      console.log(`✨ [Capsule] Opening "${capsuleData.title || 'Capsule'}" in ${coveName} (${coveId})`);

      // Notify each member
      for (const uid of memberIds) {
        const tokens = await getUserTokens(uid);
        if (tokens.length === 0) continue;

        const response = await admin.messaging().sendEachForMulticast({
          notification: {
            title: "Time Capsule Opened!",
            body: `Wait no more! A memory in ${coveName} is ready to view.`,
          },
          data: { type: 'capsule_open', coveId, capsuleId: capsuleDoc.id },
          android: { priority: 'high', notification: { channelId: 'default' } },
          tokens,
        });

        const deadTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error.code === 'messaging/registration-token-not-registered') {
            deadTokens.push(tokens[idx]);
          }
        });
        if (deadTokens.length > 0) await removeDeadTokens(uid, deadTokens);
      }

      // Update status to 'open' to prevent duplicate notifications
      await capsuleDoc.ref.update({ status: 'open', openedAt: now });
      capsulesOpened++;
    }

    // ─── LOGIC B: INACTIVE USERS (7 DAYS) ────────────────────────────────────
    console.log("💤 [Sweep] Checking for inactive users (7+ days)...");
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const inactiveSnapshot = await db.collection('users')
      .where('lastActiveAt', '<', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
      .get();

    let usersNotified = 0;
    for (const userDoc of inactiveSnapshot.docs) {
      const userData = userDoc.data();
      const lastPing = userData.lastInactivityNotificationAt;

      // Cooldown: Only notify once every 7 days
      if (lastPing && lastPing.toMillis() > (Date.now() - 7 * 24 * 60 * 60 * 1000)) continue;

      const tokens = await getUserTokens(userDoc.id);
      if (tokens.length === 0) continue;

      const response = await admin.messaging().sendEachForMulticast({
        notification: {
          title: "We miss you! 🍯",
          body: `It's been a while since your last visit. Your Coves are waiting for you!`,
        },
        android: { priority: 'high' },
        tokens,
      });

      const deadTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error.code === 'messaging/registration-token-not-registered') {
          deadTokens.push(tokens[idx]);
        }
      });
      if (deadTokens.length > 0) await removeDeadTokens(userDoc.id, deadTokens);

      if (response.successCount > 0) {
        await userDoc.ref.update({ lastInactivityNotificationAt: now });
        usersNotified++;
      }
    }

    console.log(`📊 [Sweep Results] Capsules: ${capsulesOpened}, Inactive Users: ${usersNotified}`);
    res.json({ success: true, capsulesOpened, usersNotified });
  } catch (error) {
    console.error("❌ [Sweep] Error during triggers processing:", error);
    res.status(500).json({ error: "Sweep failed." });
  }
});

// ─── 3. FUNCTIONAL TRIGGER: REPLY ALERT ──────────────────────────────────────

async function sendReplyNotification(targetUserId, commenterName) {
  try {
    const tokens = await getUserTokens(targetUserId);
    if (tokens.length === 0) return;

    const response = await admin.messaging().sendEachForMulticast({
      notification: {
        title: "New Reply!",
        body: `${commenterName} replied to your post on the Wall.`,
      },
      android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
      tokens,
    });

    const deadTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error.code === 'messaging/registration-token-not-registered') {
        deadTokens.push(tokens[idx]);
      }
    });
    if (deadTokens.length > 0) await removeDeadTokens(targetUserId, deadTokens);

    console.log(`📩 [Reply] Immediate notification sent to ${targetUserId}.`);
  } catch (error) {
    console.error("❌ [Reply] Trigger failed:", error.message);
  }
}

module.exports = {
  notificationRouter: router,
  sendReplyNotification
};
