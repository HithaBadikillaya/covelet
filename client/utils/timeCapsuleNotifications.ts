import { logger } from '@/utils/logger';
import { db } from '@/firebaseConfig';
import { apiPut } from '@/services/api';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Platform } from "react-native";

export interface TimeCapsuleNotificationEvent {
  userId: string;
  coveId: string;
  coveName: string;
  capsuleId: string;
  unlockAtSeconds: number;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function getInstallationId() {
  const existing = await AsyncStorage.getItem("@covelet:notifications:installation-id");
  if (existing) {
    return existing;
  }

  const generated = `install-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem("@covelet:notifications:installation-id", generated);
  return generated;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("time-capsule-opened", {
    name: "Time Capsule Updates",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#D4A373",
    sound: "default",
  });
}

function hasGrantedPermission(
  settings: Notifications.NotificationPermissionsStatus,
) {
  return (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function ensureNotificationPermission() {
  const existing = await Notifications.getPermissionsAsync();
  if (hasGrantedPermission(existing)) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });

  return hasGrantedPermission(requested);
}

async function persistExpoPushTokenWithFirestore(
  userId: string,
  installationId: string,
  token: string,
) {
  if (!db) {
    throw new Error('Database service is unavailable');
  }

  await setDoc(
    doc(db, "users", userId, "devices", installationId),
    {
      expoPushToken: token,
      platform: Platform.OS,
      deviceName: Device.deviceName ?? null,
      updatedAt: serverTimestamp(),
      appVersion: Constants.expoConfig?.version ?? null,
    },
    { merge: true },
  );
}

async function upsertExpoPushToken(userId: string) {
  if (!Device.isDevice) {
    return;
  }

  const projectId =
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    return;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
      .data;
    const installationId = await getInstallationId();

    const response = await apiPut<{ saved: boolean }>(
      `/users/me/devices/${installationId}`,
      {
        expoPushToken: token,
        platform: Platform.OS,
        ...(Device.deviceName ? { deviceName: Device.deviceName } : {}),
        ...(Constants.expoConfig?.version
          ? { appVersion: Constants.expoConfig.version }
          : {}),
      },
    );

    if (response.error) {
      await persistExpoPushTokenWithFirestore(userId, installationId, token);
    }
  } catch (error) {
    try {
      const installationId = await getInstallationId();
      const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
        .data;
      await persistExpoPushTokenWithFirestore(userId, installationId, token);
    } catch (fallbackError) {
      logger.warn(
        "Unable to register Expo push token for time capsule notifications.",
        fallbackError,
      );
    }
  }
}

export async function prepareTimeCapsuleNotifications(userId: string) {
  await ensureAndroidChannel();

  const granted = await ensureNotificationPermission();
  if (!granted) {
    return false;
  }

  await upsertExpoPushToken(userId);
  return true;
}

export async function syncTimeCapsuleNotification() {
  // We've moved to a backend-driven notification system via cron.
  // To stop duplicate notifications and spam, we eagerly cancel any legacy
  // scheduled notifications that the old system placed locally on the device.
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    logger.warn('Failed to clear legacy local time capsule notifications', err);
  }
}
