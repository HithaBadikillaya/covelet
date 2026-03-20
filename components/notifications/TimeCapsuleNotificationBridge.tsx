import {
    clearAllTimeCapsuleNotifications,
    clearTimeCapsuleNotificationForCove,
    prepareTimeCapsuleNotifications,
    syncTimeCapsuleNotification,
} from '@/utils/timeCapsuleNotifications';
import { db } from '@/firebaseConfig';
import type { User } from 'firebase/auth';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

interface Props {
    user: User | null;
}

function extractRouteFromResponse(response: Notifications.NotificationResponse | null) {
    const route = response?.notification.request.content.data?.route;
    return typeof route === 'string' ? route : null;
}

export function TimeCapsuleNotificationBridge({ user }: Props) {
    const router = useRouter();
    const lastHandledResponseId = useRef<string | null>(null);

    useEffect(() => {
        const handleResponse = (response: Notifications.NotificationResponse | null) => {
            if (!user) {
                return;
            }

            const route = extractRouteFromResponse(response);
            const responseId = response?.notification.request.identifier ?? null;
            if (!route || !responseId || lastHandledResponseId.current === responseId) {
                return;
            }

            lastHandledResponseId.current = responseId;
            router.push(route as any);
        };

        const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
        void Notifications.getLastNotificationResponseAsync().then(handleResponse).catch((error) => {
            console.warn('Unable to inspect the last notification response.', error);
        });

        return () => {
            subscription.remove();
        };
    }, [router, user]);

    useEffect(() => {
        if (!user?.uid) {
            return;
        }

        let disposed = false;
        let unsubscribeCoves: (() => void) | null = null;
        const capsuleUnsubscribers = new Map<string, () => void>();
        const coveNames = new Map<string, string>();

        const teardownCapsules = () => {
            capsuleUnsubscribers.forEach((unsubscribe) => unsubscribe());
            capsuleUnsubscribers.clear();
            coveNames.clear();
        };

        const start = async () => {
            if (!db || !user?.uid) {
                console.warn('⚠️ Skipping notification sync: Database or User not available.');
                return;
            }

            try {
                const enabled = await prepareTimeCapsuleNotifications(user.uid);
                if (!enabled || disposed) {
                    return;
                }

                const covesQuery = query(collection(db, 'coves'), where('members', 'array-contains', user.uid));
                unsubscribeCoves = onSnapshot(
                    covesQuery,
                    (snapshot) => {
                        const nextCoveIds = new Set(snapshot.docs.map((docSnap) => docSnap.id));

                        Array.from(capsuleUnsubscribers.entries()).forEach(([coveId, unsubscribe]) => {
                            if (!nextCoveIds.has(coveId)) {
                                unsubscribe();
                                capsuleUnsubscribers.delete(coveId);
                                coveNames.delete(coveId);
                                void clearTimeCapsuleNotificationForCove(user.uid!, coveId);
                            }
                        });

                        snapshot.docs.forEach((coveDoc) => {
                            const coveId = coveDoc.id;
                            const coveData = coveDoc.data();
                            coveNames.set(coveId, coveData.name || 'Your Cove');

                            if (capsuleUnsubscribers.has(coveId)) {
                                return;
                            }

                            const capsuleQuery = query(
                                collection(db!, 'coves', coveId, 'timeCapsules'),
                                orderBy('createdAt', 'desc'),
                                limit(1)
                            );

                            const unsubscribeCapsule = onSnapshot(
                                capsuleQuery,
                                (capsuleSnapshot) => {
                                    if (capsuleSnapshot.empty) {
                                        void clearTimeCapsuleNotificationForCove(user.uid!, coveId);
                                        return;
                                    }

                                    const capsuleDoc = capsuleSnapshot.docs[0];
                                    const capsuleData = capsuleDoc.data();
                                    const unlockAtSeconds = capsuleData.unlockAt?.seconds;

                                    if (typeof unlockAtSeconds !== 'number') {
                                        return;
                                    }

                                    void syncTimeCapsuleNotification({
                                        userId: user.uid!,
                                        coveId,
                                        coveName: coveNames.get(coveId) || 'Your Cove',
                                        capsuleId: capsuleDoc.id,
                                        unlockAtSeconds,
                                        isEmergencyOpened: !!capsuleData.isEmergencyOpened,
                                    });
                                },
                                (error) => {
                                    console.error('Time capsule notification listener failed.', error);
                                }
                            );

                            capsuleUnsubscribers.set(coveId, unsubscribeCapsule);
                        });
                    },
                    (error) => {
                        console.error('Cove notification listener failed.', error);
                    }
                );
            } catch (error) {
                console.error('Failed to initialize notification bridge:', error);
            }
        };

        void start();

        return () => {
            disposed = true;
            unsubscribeCoves?.();
            teardownCapsules();
            void clearAllTimeCapsuleNotifications(user.uid);
        };
    }, [user?.uid]);

    return null;
}