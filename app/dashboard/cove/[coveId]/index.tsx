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
                        } catch (err: any) {
                            console.error('Error deleting cove:', err);
                            if (err.code === 'permission-denied') {
                                Alert.alert('Permission Denied', 'Only the creator of this Cove can delete it.');
                            } else {
                                Alert.alert('Error', 'Failed to delete Cove.');
                            }
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

    /* ---------------- NAVIGATION HANDLERS ---------------- */
    const navigateToFeature = (path: string) => {
        router.push(`/dashboard/cove/${coveId}/${path}`);
    };

    const navigateToSettings = () => {
        if (!isOwner) return;
        router.push(`/dashboard/cove/${coveId}/settings`);
    };

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
                    {/* HEADER */}
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.replace('/(tabs)/dashboard')}>
                            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                        </TouchableOpacity>
                        {isOwner && (
                            <TouchableOpacity onPress={navigateToSettings}>
                                <Ionicons name="settings-outline" size={24} color={themeColors.text} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <Text style={[styles.title, { color: themeColors.text }]}>
                        {cove.name}
                    </Text>

                    <Text style={[styles.description, { color: themeColors.textMuted }]}>
                        {cove.description || 'A digital sanctuary.'}
                    </Text>

                    {/* FEATURE GRID */}
                    <View style={styles.grid}>
                        <FeatureCard
                            title="Time Capsule"
                            icon="hourglass-outline"
                            color="#8B5CF6"
                            onPress={() => navigateToFeature('time-capsule')}
                        />
                        <FeatureCard
                            title="Humans"
                            icon="people-outline"
                            color="#EC4899"
                            onPress={() => navigateToFeature('humans')}
                        />
                        <FeatureCard
                            title="The Wall"
                            icon="chatbubble-ellipses-outline"
                            color="#F59E0B"
                            onPress={() => navigateToFeature('wall')}
                        />
                        <FeatureCard
                            title="Memory Map"
                            icon="map-outline"
                            color="#10B981"
                            onPress={() => navigateToFeature('map')}
                        />
                        <FeatureCard
                            title="Roulette"
                            icon="dice-outline"
                            color="#3B82F6"
                            onPress={() => navigateToFeature('roulette')}
                        />
                        <FeatureCard
                            title="On this day"
                            icon="calendar-outline"
                            color="#A855F7"
                            onPress={() => navigateToFeature('flashback')}
                            fullWidth
                        />
                    </View>

                    {/* QUICK INFO (Temporary until Settings is robust) */}
                    <View style={styles.info}>
                        <Text style={styles.infoText}>Created: {createdDate}</Text>
                        <Text style={styles.infoText}>Members: {cove.members.length}</Text>
                        {isOwner && (
                            <View style={styles.codeContainer}>
                                <Text style={styles.joinLabel}>CODE:</Text>
                                <Text style={styles.joinCodeCompact}>{cove.joinCode}</Text>
                            </View>
                        )}
                    </View>

                </ScrollView>
            </View>
        </AuthGuard>
    );
}

const FeatureCard = ({ title, icon, color, onPress, fullWidth }: any) => (
    <TouchableOpacity
        style={[styles.card, fullWidth && styles.cardFull]}
        onPress={onPress}
        activeOpacity={0.8}
    >
        <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={28} color={color} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
    </TouchableOpacity>
);

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
    container: { flex: 1 },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 32,
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 32,
        opacity: 0.7,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 40,
    },
    card: {
        width: '47%',
        backgroundColor: '#fff', // Or theme variable
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        // Elevation for Android
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    cardFull: {
        width: '100%',
        flexDirection: 'row',
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontFamily: Fonts.heading,
        fontSize: 16,
        color: '#333',
    },
    info: {
        marginTop: 0,
        gap: 8,
        opacity: 0.5,
    },
    infoText: {
        fontFamily: Fonts.body,
        fontSize: 14,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    joinLabel: {
        fontSize: 12,
        letterSpacing: 1,
        fontWeight: 'bold',
    },
    joinCodeCompact: {
        fontFamily: Fonts.heading,
        fontSize: 16,
        letterSpacing: 2,
    },
});
