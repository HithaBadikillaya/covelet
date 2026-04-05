import { logger } from '@/utils/logger';

import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';

interface Props {
    user: User | null;
}

function extractRouteFromResponse(response: Notifications.NotificationResponse | null) {
    const route = response?.notification.request.content.data?.route;
    return typeof route === 'string' ? route : null;
}

/**
 * TimeCapsuleNotificationBridge handles incoming notification responses (taps)
 * and ensures the device is registered for push notifications.
 * 
 * Previous legacy logic for local scheduled notifications has been removed
 * in favor of server-side (backend) push notifications.
 */
export function TimeCapsuleNotificationBridge({ user }: Props) {
    const router = useRouter();
    const lastHandledResponseId = useRef<string | null>(null);

    // Handle notification responses (taps)
    useEffect(() => {
        const handleResponse = (response: Notifications.NotificationResponse | null) => {
            if (!user) return;

            const route = extractRouteFromResponse(response);
            const responseId = response?.notification.request.identifier ?? null;
            
            if (!route || !responseId || lastHandledResponseId.current === responseId) {
                return;
            }

            lastHandledResponseId.current = responseId;
            logger.log(`NotificationBridge: Navigating to ${route}`);
            router.push(route as any);
        };

        const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
        
        // Check if the app was opened via a notification
        void Notifications.getLastNotificationResponseAsync()
            .then(handleResponse)
            .catch((error) => {
                logger.warn('NotificationBridge: Unable to inspect the last notification response.', error);
            });

        return () => {
            subscription.remove();
        };
    }, [router, user?.uid]);



    return null;
}
