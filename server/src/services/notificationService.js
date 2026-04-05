const admin = require('firebase-admin');
const express = require('express');

// 1. Firebase Admin Initialization
// Decode process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 from Base64 to JSON
const base64ServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (base64ServiceAccount) {
    try {
        const decoded = Buffer.from(base64ServiceAccount, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(decoded);

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('🚀 [NotificationService] Firebase Admin initialized successfully via Base64.');
        }
    } catch (error) {
        console.error('❌ [NotificationService] Failed to initialize Firebase Admin:', error.message);
    }
} else {
    console.error('❌ [NotificationService] FIREBASE_SERVICE_ACCOUNT_BASE64 is missing in Render dashboard.');
}

const db = admin.firestore();
const router = express.Router();

// Helper: Remove invalid FCM tokens
async function cleanupToken(userId) {
    console.log(`🧹 [Cleanup] Deleting invalid fcm_token for user: ${userId}`);
    try {
        await db.collection('users').doc(userId).update({
            fcm_token: admin.firestore.FieldValue.delete()
        });
    } catch (error) {
        console.error(`❌ [Cleanup Error] Failed to remove token for ${userId}:`, error.message);
    }
}

// 2. The Combined '15-Minute' Route
// Path: GET /api/notifications/process-all-triggers
router.get('/process-all-triggers', async (req, res) => {
    console.log('⏰ [Cron] Starting 15-minute notification scan...');

    // Security: Check req.headers['x-cron-key'] against process.env.CRON_SECRET
    const cronSecret = process.env.CRON_SECRET;
    const incomingKey = req.headers['x-cron-key'];

    if (!cronSecret || incomingKey !== cronSecret) {
        console.warn('⚠️ [Cron] Unauthorized access attempt blocked.');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const now = new Date();
    let capsulesUnlocked = 0;
    let usersReengaged = 0;

    try {
        // --- Logic A: Timed Capsules ---
        console.log('📦 [Logic A] Checking for locked time capsules ready to open...');
        const capsulesSnap = await db.collectionGroup('timeCapsules')
            .where('status', '==', 'locked')
            .where('unlockAt', '<=', now)
            .get();

        for (const docSnap of capsulesSnap.docs) {
            const capsule = docSnap.data();
            const coveId = capsule.coveId;

            if (!coveId) {
                console.warn(`⚠️ [Unlock] Capsule ${docSnap.id} missing coveId. Skipping.`);
                continue;
            }

            // Get cove data and its members
            const coveRef = db.collection('coves').doc(coveId);
            const coveSnap = await coveRef.get();
            if (!coveSnap.exists) {
                console.warn(`⚠️ [Unlock] Parent cove ${coveId} not found for capsule ${docSnap.id}.`);
                continue;
            }

            const coveData = coveSnap.data();
            const coveName = coveData.name || 'your Cove';

            // Get all member UIDs from members subcollection
            const membersSnap = await coveRef.collection('members').get();
            const memberIds = membersSnap.docs.map(m => m.id);

            console.log(`✨ [Unlock] Opening capsule: "${capsule.title || docSnap.id}" in ${coveName}. Notifying ${memberIds.length} members.`);

            for (const uid of memberIds) {
                const userDoc = await db.collection('users').doc(uid).get();
                const fcmToken = userDoc.data()?.fcm_token;

                if (fcmToken) {
                    try {
                        await admin.messaging().send({
                            notification: {
                                title: 'Capsule Unlocked! 🔓',
                                body: `A memory in ${coveName} is now ready to view.`
                            },
                            data: {
                                type: 'time-capsule-opened',
                                coveId: coveId,
                                capsuleId: docSnap.id
                            },
                            token: fcmToken,
                            android: { priority: 'high' }
                        });
                    } catch (err) {
                        if (err.code === 'messaging/registration-token-not-registered') {
                            await cleanupToken(uid);
                        } else {
                            console.error(`❌ [FCM Error] Could not notify user ${uid}:`, err.message);
                        }
                    }
                }
            }

            // Immediately update the capsule status to 'open'
            await docSnap.ref.update({ status: 'open', unlockedAt: admin.firestore.FieldValue.serverTimestamp() });
            capsulesUnlocked++;
        }

        // --- Logic B: Inactive Users ---
        console.log('💤 [Logic B] Checking for inactive users (7+ days)...');
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const inactiveSnap = await db.collection('users')
            .where('lastActiveAt', '<', sevenDaysAgo)
            .get();

        for (const userDoc of inactiveSnap.docs) {
            const userData = userDoc.data();
            const fcmToken = userData.fcm_token;

            // Simple cooldown check to prevent spamming if they stay inactive
            const lastPing = userData.lastInactivityNotificationAt;
            if (lastPing && lastPing.toDate() > sevenDaysAgo) continue;

            if (fcmToken) {
                try {
                    await admin.messaging().send({
                        notification: {
                            title: 'We miss you in your Cove!',
                            body: "It's been a while since your last visit. Come see what's new!"
                        },
                        token: fcmToken,
                        android: { priority: 'high' }
                    });

                    await userDoc.ref.update({
                        lastInactivityNotificationAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    usersReengaged++;
                } catch (err) {
                    if (err.code === 'messaging/registration-token-not-registered' || err.code === 'messaging/invalid-argument') {
                        await cleanupToken(userDoc.id);
                    }
                }
            }
        }

        console.log(`📊 [Results] Capsules Unlocked: ${capsulesUnlocked}, Users Re-engaged: ${usersReengaged}`);
        res.json({ success: true, capsulesUnlocked, usersReengaged });

    } catch (error) {
        console.error('❌ [Cron Error] Sweep failed:', error);
        res.status(500).json({ error: 'Process failed' });
    }
});

// 3. Instant Functional Triggers
/**
 * sendReplyNotification: Sends immediate notification for replies
 */
async function sendReplyNotification(targetUserId, commenterName) {
    console.log(`📩 [Reply] Pulse triggering for user: ${targetUserId}`);
    try {
        const userDoc = await db.collection('users').doc(targetUserId).get();
        const fcmToken = userDoc.data()?.fcm_token;

        if (!fcmToken) {
            console.log(`ℹ️ [Reply] No token found for ${targetUserId}, skipping.`);
            return;
        }

        await admin.messaging().send({
            notification: {
                title: 'New Reply!',
                body: `${commenterName} replied to your post on the Wall.`
            },
            token: fcmToken,
            android: { priority: 'high' }
        });
        console.log(`✅ [Reply] Notification sent to ${targetUserId}.`);
    } catch (err) {
        if (err.code === 'messaging/registration-token-not-registered' || err.code === 'messaging/invalid-argument') {
            await cleanupToken(targetUserId);
        } else {
            console.error('❌ [Reply Error] Signal failed:', err.message);
        }
    }
}

module.exports = {
    notificationRouter: router,
    sendReplyNotification
};
