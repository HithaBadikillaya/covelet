import { AuthGuard } from '@/components/auth/AuthGuard';
import { subscribeToAuthChanges } from '@/components/auth/authService';
import { NAVBAR_HEIGHT } from '@/components/Navbar';
import { Colors, Fonts } from '@/constants/theme';
import { db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { User } from 'firebase/auth';
import { deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Cove {
    id: string;
    name: string;
    description?: string;
    members: string[];
    createdBy: string;
    joinCode: string;
    createdAt?: { seconds: number };
}

export default function CoveDetailsScreen() {
    const { coveId } = useLocalSearchParams<{ coveId: string }>();
    const insets = useSafeAreaInsets();
    const themeColors = Colors.light;

    const [cove, setCove] = useState<Cove | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    /* ---------------- AUTH SUBSCRIPTION ---------------- */
    useEffect(() => {
        const unsubAuth = subscribeToAuthChanges(setUser);
        return () => unsubAuth();
    }, []);

    /* ---------------- COVE SNAPSHOT ---------------- */
    useEffect(() => {
        if (!user || !coveId) return;

        const coveRef = doc(db, 'coves', coveId);

        const unsubscribe = onSnapshot(
            coveRef,
            (snap) => {
                if (!snap.exists()) {
                    router.replace('/(tabs)/dashboard');
                    return;
                }

                const data = { id: snap.id, ...snap.data() } as Cove;

                if (!data.members.includes(user.uid)) {
                    router.replace('/(tabs)/dashboard');
                    return;
                }

                setCove(data);
                setLoading(false);
            },
            () => {
                router.replace('/(tabs)/dashboard');
            }
        );

        return () => unsubscribe();
    }, [user, coveId]);

    /* ---------------- DELETE HANDLER ---------------- */
    const handleDelete = () => {
        if (!cove || !user || cove.createdBy !== user.uid) return;

        Alert.alert(
            'Delete Cove',
            'This action is permanent and cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            setCove(null);

                            await deleteDoc(doc(db, 'coves', cove.id));

                            router.replace('/(tabs)/dashboard');
                        } catch {
                            Alert.alert('Error', 'Failed to delete Cove.');
                        }
                    },
                },
            ]
        );
    };

    /* ---------------- LOADING ---------------- */
    if (loading) {
        return (
            <View style={[styles.loading, { backgroundColor: themeColors.background }]}>
                <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
        );
    }

    if (!cove || !user) return null;

    const isOwner = cove.createdBy === user.uid;
    const createdDate = cove.createdAt
        ? new Date(cove.createdAt.seconds * 1000).toDateString()
        : '—';

    return (
        <AuthGuard>
            <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                <ScrollView
                    contentContainerStyle={{
                        paddingTop: insets.top + NAVBAR_HEIGHT + 24,
                        paddingHorizontal: 24,
                        paddingBottom: 40,
                    }}
                >
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                    </TouchableOpacity>

                    <Text style={[styles.title, { color: themeColors.text }]}>
                        {cove.name}
                    </Text>

                    {isOwner && (
                        <Text style={[styles.owner, { color: themeColors.primary }]}>
                            OWNER
                        </Text>
                    )}

                    <Text style={[styles.description, { color: themeColors.textMuted }]}>
                        {cove.description || 'A digital sanctuary.'}
                    </Text>

                    <View style={styles.info}>
                        <Text style={styles.infoText}>Created: {createdDate}</Text>
                        <Text style={styles.infoText}>
                            Members: {cove.members.length}
                        </Text>
                    </View>

                    {isOwner && (
                        <View style={styles.ownerSection}>
                            <Text style={styles.joinLabel}>JOIN CODE</Text>
                            <Text style={styles.joinCode}>{cove.joinCode}</Text>

                            <TouchableOpacity
                                style={[styles.deleteBtn, { borderColor: themeColors.error }]}
                                onPress={handleDelete}
                            >
                                <Ionicons name="trash-outline" size={20} color={themeColors.error} />
                                <Text style={[styles.deleteText, { color: themeColors.error }]}>
                                    Delete Cove
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </View>
        </AuthGuard>
    );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
    container: { flex: 1 },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    title: {
        fontFamily: Fonts.heading,
        fontSize: 32,
        marginTop: 24,
    },
    owner: {
        marginTop: 4,
        fontSize: 12,
        letterSpacing: 2,
    },
    description: {
        marginTop: 24,
        fontSize: 18,
        lineHeight: 26,
    },
    info: {
        marginTop: 32,
        gap: 8,
    },
    infoText: {
        fontFamily: Fonts.body,
        fontSize: 16,
        color: '#999',
    },
    ownerSection: {
        marginTop: 40,
        gap: 16,
    },
    joinLabel: {
        fontSize: 12,
        letterSpacing: 2,
        color: '#888',
    },
    joinCode: {
        fontFamily: Fonts.heading,
        fontSize: 28,
        letterSpacing: 6,
        color: '#0EA5E9',
    },
    deleteBtn: {
        marginTop: 24,
        height: 56,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    deleteText: {
        fontFamily: Fonts.heading,
        fontSize: 16,
    },
});
