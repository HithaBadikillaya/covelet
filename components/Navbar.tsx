import { subscribeToAuthChanges } from '@/components/auth/authService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Colors, Fonts } from '@/constants/theme';
import { auth } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, usePathname } from 'expo-router';
import { User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const NAVBAR_HEIGHT = 64;

export const Navbar = () => {
    const insets = useSafeAreaInsets();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges((u) => {
            setUser(u);
        });
        return unsubscribe;
    }, []);

    const handleNav = (path: string) => {
        router.push(path as any);
    };

    const handleAvatarClick = () => {
        if (user) {
            setShowDropdown(true);
        } else {
            router.push('/login');
        }
    };

    const handleLogout = async () => {
        setShowDropdown(false);
        await auth.signOut();
        router.replace('/');
    };

    const getInitials = (name: string | null) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <View
            style={[
                styles.wrapper,
                {
                    paddingTop: insets.top,
                    backgroundColor: '#000000',
                    borderBottomWidth: 1,
                    borderBottomColor: '#404040',
                },
            ]}
        >
            <View
                style={[
                    styles.container,
                    {
                        height: NAVBAR_HEIGHT,
                    },
                ]}
            >
                {/* Left: Logo/App Name */}
                <TouchableOpacity onPress={() => handleNav('/')} activeOpacity={0.7}>
                    <Image
                        source={require('@/assets/images/logo.png')}
                        style={styles.logo}
                        contentFit="contain"
                    />
                </TouchableOpacity>

                {/* Right: Avatar */}
                <TouchableOpacity onPress={handleAvatarClick} activeOpacity={0.8}>
                    <View style={styles.avatarContainer}>
                        {user ? (
                            <Avatar className="h-10 w-10">
                                {user.photoURL ? (
                                    <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
                                ) : null}
                                <AvatarFallback
                                    className="bg-primary"
                                    style={styles.avatarFallback}
                                >
                                    <Text style={styles.avatarText}>
                                        {getInitials(user.displayName)}
                                    </Text>
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <Avatar className="h-10 w-10">
                                <AvatarFallback
                                    className="bg-muted"
                                    style={styles.avatarFallbackLoggedOut}
                                >
                                    <Ionicons name="person-outline" size={20} color="#FFFFFF" />
                                </AvatarFallback>
                            </Avatar>
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            {/* Dropdown Modal for Logged-in Users */}
            {user && (
                <Modal
                    visible={showDropdown}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowDropdown(false)}
                >
                    <Pressable
                        style={styles.modalOverlay}
                        onPress={() => setShowDropdown(false)}
                    >
                        <View style={styles.dropdown}>
                            <View style={styles.dropdownHeader}>
                                <Text style={styles.userName}>{user.displayName || 'User'}</Text>
                                <Text style={styles.userEmail}>{user.email}</Text>
                            </View>

                            <View style={styles.divider} />

                            <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={handleLogout}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="log-out-outline" size={20} color={Colors.light.primary} />
                                <Text style={styles.dropdownItemText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Modal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        zIndex: 100,
        position: 'absolute',
        top: 0,
    },
    container: {
        width: '100%',
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    logo: {
        width: 100,
        height: 28,
    },
    avatarContainer: {
        // Avatar component handles its own styling
    },
    avatarFallback: {
        backgroundColor: Colors.light.primary,
    },
    avatarFallbackLoggedOut: {
        backgroundColor: Colors.light.muted,
    },
    avatarText: {
        color: Colors.light.background,
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 80,
        paddingRight: 24,
    },
    dropdown: {
        backgroundColor: Colors.light.popover,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.light.border,
        minWidth: 220,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    dropdownHeader: {
        padding: 16,
    },
    userName: {
        color: Colors.light.text,
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        marginBottom: 4,
    },
    userEmail: {
        color: Colors.light.textMuted,
        fontFamily: Fonts.body,
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.light.border,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    dropdownItemText: {
        color: Colors.light.primary,
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
    },
});
