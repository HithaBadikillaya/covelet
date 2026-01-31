import { subscribeToAuthChanges } from '@/components/auth/authService';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import { User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface AuthGuardProps {
    children: React.ReactNode;
    redirectTo?: string;
}

/**
 * AuthGuard - Protects routes by checking Firebase auth state
 * Redirects to login if user is not authenticated
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
    children,
    redirectTo = '/login'
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges((u) => {
            setUser(u);
            setLoading(false);

            // Redirect to login if not authenticated
            if (!u) {
                router.replace(redirectTo as any);
            }
        });

        return unsubscribe;
    }, [redirectTo]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
        );
    }

    // Only render children if user is authenticated
    return user ? <>{children}</> : null;
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
    },
});
