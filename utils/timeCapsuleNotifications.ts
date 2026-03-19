import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/firebaseConfig';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

const INSTALLATION_ID_KEY = '@covelet:notifications:installation-id';
const SCHEDULE_PREFIX = '@covelet:time-capsule:schedule:';
const DELIVERED_PREFIX = '@covelet:time-capsule:delivered:';
const TIME_CAPSULE_CHANNEL_ID = 'time-capsule-opened';

interface StoredSchedule {
    eventKey: string;
    notificationId: string;
}

export interface TimeCapsuleNotificationEvent {
    userId: string;
    coveId: string;
    coveName: string;
    capsuleId: string;
    unlockAtSeconds: number;
    isEmergencyOpened: boolean;
}

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

function scheduleStorageKey(userId: string, coveId: string) {
    return `${SCHEDULE_PREFIX}${userId}:${coveId}`;
}

function deliveredStorageKey(userId: string, eventKey: string) {
    return `${DELIVERED_PREFIX}${userId}:${eventKey}`;
}

function buildEventKey(event: Omit<TimeCapsuleNotificationEvent, 'userId' | 'coveName'>) {
    const mode = event.isEmergencyOpened ? 'emergency' : 'scheduled';
    return `${event.coveId}:${event.capsuleId}:${event.unlockAtSeconds}:${mode}`;
}

function buildNotificationRoute(coveId: string) {
    return `/dashboard/cove/${coveId}/time-capsule`;
}

function buildNotificationContent(event: TimeCapsuleNotificationEvent) {
    return {
        title: 'Time Capsule Opened',
        body: `${event.coveName} is ready to open. Tap to read what your Cove left behind.`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        channelId: Platform.OS === 'android' ? TIME_CAPSULE_CHANNEL_ID : undefined,
        data: {
            type: 'time-capsule-opened',
            route: buildNotificationRoute(event.coveId),
            coveId: event.coveId,
            capsuleId: event.capsuleId,
        },
    };
}

async function getInstallationId() {
    const existing = await AsyncStorage.getItem(INSTALLATION_ID_KEY);
    if (existing) {
        return existing;
    }

    const generated = `install-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(INSTALLATION_ID_KEY, generated);
    return generated;
}

async function ensureAndroidChannel() {
    if (Platform.OS !== 'android') {
        return;
    }

    await Notifications.setNotificationChannelAsync(TIME_CAPSULE_CHANNEL_ID, {
        name: 'Time Capsule Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D4A373',
        sound: 'default',
    });
}

function hasGrantedPermission(settings: Notifications.NotificationPermissionsStatus) {
    return (
        settings.granted ||
        settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
}

async function ensureNotificationPermission() {
    if (Platform.OS === 'web') {
        return false;
    }

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

async function upsertExpoPushToken(userId: string) {
    if (Platform.OS === 'web' || !Device.isDevice) {
        return;
    }

    const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
        return;
    }

    try {
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        const installationId = await getInstallationId();

        await setDoc(
            doc(db, 'users', userId, 'devices', installationId),
            {
                expoPushToken: token,
                platform: Platform.OS,
                deviceName: Device.deviceName ?? null,
                updatedAt: serverTimestamp(),
                appVersion: Constants.expoConfig?.version ?? null,
            },
            { merge: true }
        );
    } catch (error) {
        console.warn('Unable to register Expo push token for time capsule notifications.', error);
    }
}

async function readStoredSchedule(userId: string, coveId: string): Promise<StoredSchedule | null> {
    const raw = await AsyncStorage.getItem(scheduleStorageKey(userId, coveId));
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as StoredSchedule;
    } catch {
        await AsyncStorage.removeItem(scheduleStorageKey(userId, coveId));
        return null;
    }
}

async function storeSchedule(userId: string, coveId: string, schedule: StoredSchedule) {
    await AsyncStorage.setItem(scheduleStorageKey(userId, coveId), JSON.stringify(schedule));
}

async function markDelivered(userId: string, eventKey: string) {
    await AsyncStorage.setItem(deliveredStorageKey(userId, eventKey), '1');
}

async function hasDelivered(userId: string, eventKey: string) {
    return (await AsyncStorage.getItem(deliveredStorageKey(userId, eventKey))) === '1';
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

export async function clearTimeCapsuleNotificationForCove(userId: string, coveId: string) {
    const schedule = await readStoredSchedule(userId, coveId);
    if (schedule?.notificationId) {
        try {
            await Notifications.cancelScheduledNotificationAsync(schedule.notificationId);
        } catch (error) {
            console.warn('Unable to cancel scheduled time capsule notification.', error);
        }
    }

    await AsyncStorage.removeItem(scheduleStorageKey(userId, coveId));
}

export async function clearAllTimeCapsuleNotifications(userId: string) {
    const keys = await AsyncStorage.getAllKeys();
    const scheduleKeys = keys.filter((key) => key.startsWith(`${SCHEDULE_PREFIX}${userId}:`));

    if (scheduleKeys.length === 0) {
        return;
    }

    const schedules = await AsyncStorage.multiGet(scheduleKeys);
    await Promise.all(
        schedules.map(async ([, value]) => {
            if (!value) {
                return;
            }

            try {
                const parsed = JSON.parse(value) as StoredSchedule;
                if (parsed.notificationId) {
                    await Notifications.cancelScheduledNotificationAsync(parsed.notificationId);
                }
            } catch (error) {
                console.warn('Unable to clear a stored time capsule notification.', error);
            }
        })
    );

    await AsyncStorage.multiRemove(scheduleKeys);
}

export async function syncTimeCapsuleNotification(event: TimeCapsuleNotificationEvent) {
    if (Platform.OS === 'web') {
        return;
    }

    const eventKey = buildEventKey({
        coveId: event.coveId,
        capsuleId: event.capsuleId,
        unlockAtSeconds: event.unlockAtSeconds,
        isEmergencyOpened: event.isEmergencyOpened,
    });
    const delivered = await hasDelivered(event.userId, eventKey);
    const storedSchedule = await readStoredSchedule(event.userId, event.coveId);
    const unlockAtMs = event.unlockAtSeconds * 1000;
    const isUnlocked = event.isEmergencyOpened || unlockAtMs <= Date.now();

    if (isUnlocked) {
        if (storedSchedule?.eventKey === eventKey) {
            await AsyncStorage.removeItem(scheduleStorageKey(event.userId, event.coveId));
            await markDelivered(event.userId, eventKey);
            return;
        }

        if (storedSchedule) {
            await clearTimeCapsuleNotificationForCove(event.userId, event.coveId);
        }

        if (!delivered) {
            await Notifications.scheduleNotificationAsync({
                content: buildNotificationContent(event),
                trigger: null,
            });
            await markDelivered(event.userId, eventKey);
        }
        return;
    }

    if (storedSchedule?.eventKey === eventKey || delivered) {
        return;
    }

    if (storedSchedule) {
        await clearTimeCapsuleNotificationForCove(event.userId, event.coveId);
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
        content: buildNotificationContent(event),
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(unlockAtMs),
        },
    });

    await storeSchedule(event.userId, event.coveId, {
        eventKey,
        notificationId,
    });
}