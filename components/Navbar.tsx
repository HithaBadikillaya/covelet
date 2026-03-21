import { subscribeToAuthChanges } from '@/components/auth/authService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Colors, Fonts, Layout } from '@/constants/theme';
import { auth, db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const NAVBAR_HEIGHT = 72;

export const Navbar = () => {
    const insets = useSafeAreaInsets();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<{ name?: string; email?: string } | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges((u) => {
            setUser(u);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!user || !db) {
            setProfile(null);
            return;
        }

        return onSnapshot(doc(db, 'users', user.uid), (snap) => {
            setProfile(snap.exists() ? (snap.data() as { name?: string; email?: string }) : null);
        });
    }, [user]);

    const handleNav = (path: string) => {
        if (pathname === path) return;
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
        try {
            await auth?.signOut();
        } catch (e) {
            console.error('Logout failed:', e);
        }
        router.replace('/');
    };

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const displayName = profile?.name || 'User';
    const displayEmail = profile?.email || user?.email || '';

    return (
        <View style={[styles.navbar, { paddingTop: insets.top + 12, backgroundColor: Colors.light.background, borderBottomWidth: 2, borderBottomColor: Colors.light.border }]}> 
            <View style={[styles.container, { height: NAVBAR_HEIGHT }]}> 
                <TouchableOpacity onPress={() => handleNav('/')} activeOpacity={0.8} style={styles.logoContainer}>
                    <Text style={styles.logoLabel}>COVELET</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAvatarClick} activeOpacity={0.8} style={styles.avatarButton}>
                    <View style={styles.avatarWrapper}>
                        {user ? (
                            <Avatar className="h-10 w-10">
                                {user.photoURL ? (
                                    <AvatarImage src={user.photoURL} alt={displayName} />
                                ) : (
                                    <AvatarFallback className="bg-primary" style={styles.avatarFallback}>
                                        <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
                                    </AvatarFallback>
                                )}
                            </Avatar>
                        ) : (
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-muted" style={styles.avatarFallbackLoggedOut}>
                                    <Ionicons name="person-outline" size={20} color={Colors.light.text} />
                                </AvatarFallback>
                            </Avatar>
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            {user ? (
                <Modal visible={showDropdown} transparent animationType="none" onRequestClose={() => setShowDropdown(false)}>
                    <Pressable 
                        style={[styles.modalOverlay, { paddingTop: NAVBAR_HEIGHT + insets.top + 20 }]} 
                        onPress={() => setShowDropdown(false)}
                    >
                        <View style={styles.dropdown}>
                            <View style={styles.dropdownHeader}>
                                <Text style={styles.userName}>{displayName}</Text>
                                <Text style={styles.userEmail}>{displayEmail}</Text>
                            </View>
                            <View style={styles.divider} />
                            <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout} activeOpacity={0.7}>
                                <Ionicons name="log-out-outline" size={20} color={Colors.light.primary} />
                                <Text style={styles.dropdownItemText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Modal>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    navbar: { width: '100%', zIndex: 100, position: 'absolute', top: 0 },
    container: { width: '100%', paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    logoContainer: { height: '100%', justifyContent: 'center' },
    logoLabel: { fontFamily: Fonts.heading, fontSize: 20, color: Colors.light.primary, letterSpacing: 1 },
    avatarButton: { justifyContent: 'center', alignItems: 'center' },
    avatarWrapper: { borderWidth: 2, borderColor: Colors.light.border, padding: 2, backgroundColor: '#FFFFFF' },
    avatarFallback: { backgroundColor: Colors.light.primary },
    avatarFallbackLoggedOut: { backgroundColor: Colors.light.muted },
    avatarText: { color: '#FFFFFF', fontFamily: Fonts.bodyBold, fontSize: 14 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(47, 46, 44, 0.3)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingRight: 20 },
    dropdown: { backgroundColor: '#FFFFFF', borderRadius: Layout.radiusLarge, borderWidth: 2, borderColor: Colors.light.text, minWidth: 220, shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.1, shadowRadius: 0, elevation: 0 },
    dropdownHeader: { padding: 20 },
    userName: { color: Colors.light.text, fontFamily: Fonts.heading, fontSize: 18, marginBottom: 2 },
    userEmail: { color: Colors.light.textMuted, fontFamily: Fonts.body, fontSize: 13 },
    divider: { height: 2, backgroundColor: Colors.light.border },
    dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    dropdownItemText: { color: Colors.light.primary, fontFamily: Fonts.heading, fontSize: 15 },
});