/**
 * NotificationService.js
 *
 * Native FCM push notification service for Expo Bare Workflow (Android).
 * Uses Notifications.getDevicePushTokenAsync() to get the raw FCM token
 * (NOT an Expo push token) and saves it to Firestore.
 *
 * This token is consumed exclusively by the Node.js backend via firebase-admin.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { logger } from '@/utils/logger';

// ─── Foreground notification behavior ────────────────────────────────────────
// Show the notification as a banner even when the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Android notification channel ────────────────────────────────────────────
// Required for Android 8+ (API 26+). Must be created before any notification
// is displayed. The channelId must match what the backend sends.
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'Covelet Notifications',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF8C42',
    sound: 'default',
  });
}

/**
 * Request notification permissions from the OS.
 * Returns true if granted, false otherwise.
 *
 * @returns {Promise<boolean>}
 */
export async function requestNotificationPermissions() {
  if (!Device.isDevice) {
    logger.warn('[Notifications] Not a physical device — skipping permission request.');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== 'granted') {
    logger.warn('[Notifications] Permission denied by the user.');
    return false;
  }

  return true;
}

/**
 * Get the raw native FCM device token.
 *
 * IMPORTANT: This uses getDevicePushTokenAsync(), NOT getExpoPushTokenAsync().
 * The raw FCM token is required when sending notifications directly via
 * firebase-admin on the backend (without going through Expo's push proxy).
 *
 * @returns {Promise<string | null>} The raw FCM token, or null on failure.
 */
export async function getFcmToken() {
  if (!Device.isDevice) {
    return null;
  }

  try {
    // For Android, getDevicePushTokenAsync() returns the FCM registration token.
    // For iOS, it would return the APNs token — but this app is Android-only.
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const token = tokenData?.data;

    if (typeof token !== 'string' || !token) {
      logger.warn('[Notifications] getDevicePushTokenAsync returned an empty token.');
      return null;
    }

    logger.log('[Notifications] FCM token obtained.');
    return token;
  } catch (error) {
    // Common error: Google Play Services not available on emulator/rooted device.
    logger.error('[Notifications] Failed to get FCM token:', error?.message || error);
    return null;
  }
}

/**
 * Save or update the user's FCM token in Firestore.
 *
 * Path: users/{uid}/devices/{deviceId}
 *
 * Each physical device gets its own document keyed by a stable device ID
 * so a user can have tokens for multiple devices simultaneously.
 *
 * @param {string} uid              - Authenticated Firebase user UID.
 * @param {string} fcmToken         - Raw FCM registration token.
 * @returns {Promise<void>}
 */
export async function saveFcmTokenToFirestore(uid, fcmToken) {
  if (!uid || !fcmToken) {
    return;
  }

  try {
    // Use a stable device identifier. Falls back to a fixed key if unavailable.
    const deviceId =
      Constants.deviceName?.replace(/\s+/g, '_').toLowerCase() ||
      Constants.sessionId ||
      'primary_device';

    const deviceRef = doc(db, 'users', uid, 'devices', deviceId);

    await setDoc(
      deviceRef,
      {
        fcmToken,
        platform: Platform.OS,       // 'android'
        deviceName: Constants.deviceName || null,
        appVersion: Constants.expoConfig?.version || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }               // Merge so other fields are preserved
    );

    logger.log('[Notifications] FCM token saved to Firestore.', { deviceId });
  } catch (error) {
    logger.error('[Notifications] Failed to save FCM token to Firestore:', error);
  }
}

/**
 * Update the user's lastActiveAt timestamp in Firestore.
 * Call this every time the app is opened / comes to the foreground.
 * This timestamp is used by the backend inactivity cron check.
 *
 * @param {string} uid - Authenticated Firebase user UID.
 * @returns {Promise<void>}
 */
export async function updateLastActive(uid) {
  if (!uid) return;

  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      { lastActiveAt: serverTimestamp() },
      { merge: true }
    );
  } catch (error) {
    // Non-critical — log and swallow
    logger.warn('[Notifications] Failed to update lastActiveAt:', error?.message);
  }
}

/**
 * Full setup flow — call once on app startup when the user is authenticated.
 *
 * 1. Requests permissions
 * 2. Gets the FCM token
 * 3. Saves/updates the token in Firestore
 * 4. Updates the user's lastActiveAt
 *
 * @param {string} uid - Authenticated Firebase user UID.
 * @returns {Promise<void>}
 */
export async function setupNotifications(uid) {
  if (!uid) return;

  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return;

    const fcmToken = await getFcmToken();
    if (fcmToken) {
      await saveFcmTokenToFirestore(uid, fcmToken);
    }

    await updateLastActive(uid);
  } catch (error) {
    logger.error('[Notifications] setupNotifications failed:', error);
  }
}
