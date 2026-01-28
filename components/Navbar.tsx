import { subscribeToAuthChanges } from '@/backend/auth/authService';
import { Colors, Fonts } from '@/constants/theme';
import { auth } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Image } from 'expo-image';
import { router, usePathname } from 'expo-router';
import { User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const Navbar = () => {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const pathname = usePathname();
    const isDark = colorScheme === 'dark';
    const themeColors = Colors[isDark ? 'dark' : 'light'];
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges((u) => {
            setUser(u);
        });
        return unsubscribe;
    }, []);

    const handleNav = (path: string) => {
        router.push(path as any);
    };

    return (
        <View style={[
            styles.container,
            {
                paddingTop: insets.top,
                backgroundColor: isDark ? 'rgba(26, 42, 56, 0.95)' : 'rgba(248, 251, 255, 0.95)',
                borderBottomColor: themeColors.sand,
                borderBottomWidth: 1
            }
        ]}>
            <View style={styles.content}>
                <TouchableOpacity onPress={() => handleNav('/')} activeOpacity={0.7}>
                    <Image
                        source={require('@/assets/images/logo.png')}
                        style={styles.logo}
                        contentFit="contain"
                    />
                </TouchableOpacity>

                <View style={styles.rightContent}>
                    {user ? (
                        <>
                            <TouchableOpacity onPress={() => handleNav('/(tabs)/dashboard')} style={styles.navLink}>
                                <Text style={[styles.navLinkText, { color: themeColors.ocean, borderBottomWidth: pathname === '/dashboard' ? 2 : 0, borderBottomColor: themeColors.ocean }]}>
                                    Dashboard
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => auth.signOut()} style={styles.navLink}>
                                <Text style={[styles.navLinkText, { color: themeColors.text, opacity: 0.6 }]}>
                                    Logout
                                </Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity
                            onPress={() => handleNav('/login')}
                            style={[styles.loginButton, { borderColor: themeColors.ocean }]}
                        >
                            <Text style={[styles.loginButtonText, { color: themeColors.ocean }]}>
                                Sign In
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        zIndex: 100,
        position: 'absolute',
        top: 0,
    },
    content: {
        height: 60,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    logo: {
        width: 100,
        height: 28,
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    navLink: {
        paddingVertical: 8,
    },
    navLinkText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        letterSpacing: 0.5,
    },
    loginButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
    },
    loginButtonText: {
        fontFamily: Fonts.heading,
        fontSize: 14,
        letterSpacing: 1,
    },
});
