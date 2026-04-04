const { getFirestore, admin } = require('../config/firebase');
const { logger } = require('../utils/logger');
const { sendExpoPushNotifications, isExpoPushToken } = require('./expoPush');

const INACTIVITY_THRESHOLD_DAYS = 3;
const COOLDOWN_DAYS = 7;

/**
 * Fetch users who haven't been active for a few days and haven't been notified recently.
 */
async function fetchInactiveUsers() {
  const db = getFirestore();
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - INACTIVITY_THRESHOLD_DAYS);

  const cooldownDate = new Date();
  cooldownDate.setDate(cooldownDate.getDate() - COOLDOWN_DAYS);

  // 1. Get users inactive for > 3 days
  const usersSnapshot = await db.collection('users')
    .where('lastActiveAt', '<', admin.firestore.Timestamp.fromDate(thresholdDate))
    .get();

  const inactiveUsers = [];

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const lastNotified = userData.lastEngagementNotificationAt;

    // 2. Filter by cooldown (default 7 days) to avoid spamming
    if (!lastNotified || lastNotified.toMillis() < cooldownDate.getTime()) {
      inactiveUsers.push({ id: userDoc.id, ...userData });
    }
  }

  return inactiveUsers;
}

/**
 * Collect all valid Expo push tokens for a specific user.
 */
async function collectUserTokens(uid) {
  const db = getFirestore();
  const tokens = [];
  const devicesSnapshot = await db.collection('users').doc(uid).collection('devices').get();
  
  devicesSnapshot.forEach((doc) => {
    const token = doc.data()?.expoPushToken;
    if (isExpoPushToken(token)) {
      tokens.push(token);
    }
  });

  return tokens;
}

/**
 * Main worker function to find and notify inactive users.
 */
async function sendEngagementNotifications() {
  try {
    const users = await fetchInactiveUsers();
    if (users.length === 0) return;

    logger.info(`[Retention] Found ${users.length} inactive users to notify.`);

    const db = getFirestore();
    const batch = db.batch();
    const notifications = [];

    for (const user of users) {
      const tokens = await collectUserTokens(user.id);
      
      if (tokens.length > 0) {
        tokens.forEach((token) => {
          notifications.push({
            to: token,
            title: 'We miss you! 🍯',
            body: `Hey ${user.name || 'there'}! It's been a while since you visited your Coves. Come see what your friends are up to!`,
            sound: 'default',
            data: { type: 'engagement_reminder' },
          });
        });

        // Mark as notified in this "wave"
        batch.update(db.collection('users').doc(user.id), {
          lastEngagementNotificationAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    if (notifications.length > 0) {
      await sendExpoPushNotifications(notifications);
      await batch.commit();
      logger.info(`[Retention] Successfully sent ${notifications.length} engagement notifications.`);
    }
  } catch (error) {
    logger.error('[Retention] Failed to process inactivity notifications.', { error });
  }
}

/**
 * Starts a background loop to check for inactive users.
 * Defaults to once every 24 hours.
 */
function startRetentionWorker(intervalMs = 24 * 60 * 60 * 1000) {
  logger.info('[Retention] Worker initialized.');
  
  // Initial delay of 1 minute to avoid startup contention
  setTimeout(() => {
    sendEngagementNotifications();
  }, 60000);

  // Set periodic interval
  setInterval(() => {
    sendEngagementNotifications();
  }, intervalMs);
}

module.exports = { startRetentionWorker };
