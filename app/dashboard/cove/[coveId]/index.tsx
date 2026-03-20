import { subscribeToAuthChanges } from '@/components/auth/authService';
import { NAVBAR_HEIGHT } from '@/components/Navbar';
import { getCoveBackgroundUrl } from '@/utils/avatar';
import { Image } from 'expo-image';
import { Colors, Fonts, Layout } from '@/constants/theme';
import { db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
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
    avatarSeed?: string;
}

export default function CoveScreen() {
    const { coveId } = useLocalSearchParams<{ coveId: string }>();
    const insets = useSafeAreaInsets();
    const [cove, setCove] = useState<Cove | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubAuth = subscribeToAuthChanges(setUser);
        return () => unsubAuth();
    }, []);

    useEffect(() => {
        if (!user || !coveId || !db) return;
        const coveRef = doc(db, 'coves', coveId);
        const unsubscribe = onSnapshot(coveRef, (snap) => {
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
        }, (err) => {
            console.error("Cove detail error:", err);
            router.replace('/(tabs)/dashboard');
        });
        return () => unsubscribe();
    }, [user, coveId]);

    if (loading || !cove || !user) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
        );
    }

    const isOwner = cove.createdBy === user.uid;
    const createdDate = cove.createdAt
        ? new Date(cove.createdAt.seconds * 1000).toLocaleDateString()
        : 'Recently';

    const navigateToFeature = (path: string) => {
        router.push(`/dashboard/cove/${coveId}/${path}` as any);
    };

    const coveBgUrl = cove?.avatarSeed ? getCoveBackgroundUrl(cove.avatarSeed) : null;

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + NAVBAR_HEIGHT + 20 }
                ]}
            >
                {/* BACK BUTTON */}
                <Pressable
                    onPress={() => router.replace('/(tabs)/dashboard')}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
                </Pressable>

                {/* HEADER CARD */}
                <View style={styles.headerCard}>
                    {coveBgUrl && (
                        <Image 
                            source={{ uri: coveBgUrl }} 
                            style={styles.headerBg}
                            contentFit="cover"
                        />
                    )}
                    
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>{cove.name.toUpperCase()}</Text>
                        <Text style={styles.description}>
                            {cove.description || 'A digital sanctuary for your shared memories.'}
                        </Text>
                        
                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Ionicons name="calendar-outline" size={14} color={Colors.light.text} />
                                <Text style={styles.infoText}>{createdDate}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="people-outline" size={14} color={Colors.light.text} />
                                <Text style={styles.infoText}>{cove.members.length} members</Text>
                            </View>
                        </View>

                        {isOwner && (
                            <View style={styles.inviteBox}>
                                <Text style={styles.inviteLabel}>INVITE CODE</Text>
                                <Text style={styles.inviteCode}>{cove.joinCode}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* FEATURE GRID */}
                <View style={styles.grid}>
                    <FeatureCard
                        title="THE WALL"
                        icon="chatbubbles"
                        description="Share messages and notes with each other."
                        color={Colors.light.primary}
                        onPress={() => navigateToFeature('wall')}
                        size="large"
                    />
                    
                    <FeatureCard
                        title="BOARD"
                        icon="clipboard-outline"
                        color="#D4A373"
                        onPress={() => navigateToFeature('map')}
                        size="small"
                    />

                    <FeatureCard
                        title="CAPSULE"
                        icon="hourglass"
                        color="#A68B6D"
                        onPress={() => navigateToFeature('time-capsule')}
                        size="small"
                    />

                    <FeatureCard
                        title="MEMBERS"
                        icon="people"
                        color="#7A7875"
                        onPress={() => navigateToFeature('members')}
                        size="small"
                    />

                    <FeatureCard
                        title="ROULETTE"
                        icon="shuffle"
                        color="#E6A055"
                        onPress={() => navigateToFeature('roulette')}
                        size="small"
                    />

                    <FeatureCard
                        title="CONSTELLATION"
                        icon="sparkles"
                        color="#4A5568"
                        onPress={() => navigateToFeature('constellation')}
                        size="wide"
                    />

                    <FeatureCard
                        title="FLASHBACK"
                        icon="time"
                        color="#5589E6"
                        onPress={() => navigateToFeature('flashback')}
                        size="wide"
                    />

                    {isOwner && (
                        <FeatureCard
                            title="SETTINGS"
                            icon="settings-outline"
                            color={Colors.light.error}
                            onPress={() => router.push(`/dashboard/cove/${coveId}/settings` as any)}
                            size="wide"
                        />
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const FeatureCard = ({ title, icon, description, color, onPress, size }: any) => {
    const isSmall = size === 'small';

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.cardWrapper,
                size === 'large' && styles.cardLarge,
                size === 'wide' && styles.cardWide,
                size === 'small' && styles.cardSmall,
                pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] }
            ]}
        >
            <View
                style={[
                    styles.featureCard,
                    isSmall && { flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
                    {
                        backgroundColor: '#FFFFFF',
                        borderColor: Colors.light.text,
                    }
                ]}
            >
                <View style={[
                    styles.iconBox, 
                    { backgroundColor: color + '15' },
                    isSmall && { width: 44, height: 44, marginBottom: 8, marginRight: 0 }
                ]}>
                    <Ionicons name={icon} size={isSmall ? 22 : (size === 'large' ? 36 : 24)} color={color} />
                </View>
                <View style={[styles.cardText, isSmall && { alignItems: 'center' }]}>
                    <Text 
                        style={[styles.cardTitle, isSmall && { fontSize: 15, textAlign: 'center' }]} 
                        numberOfLines={isSmall ? 1 : 1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                    >
                        {title}
                    </Text>
                    {description && size === 'large' && (
                        <Text style={styles.cardDesc}>{description}</Text>
                    )}
                </View>
                {!isSmall && (
                    <Ionicons name="chevron-forward" size={16} color={Colors.light.textMuted} />
                )}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 60,
    },
    backButton: {
        width: 44,
        height: 44,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: Colors.light.text,
        borderRadius: 0,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
        elevation: 2,
    },
    headerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: Layout.radiusLarge,
        marginBottom: 32,
        borderWidth: 2,
        borderColor: Colors.light.text,
        shadowColor: '#000',
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
        elevation: 6,
        overflow: 'hidden',
    },
    headerBg: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.15,
    },
    headerContent: {
        padding: 32,
        paddingTop: 48,
        alignItems: 'center',
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 28,
        color: Colors.light.text,
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: 1,
    },
    description: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.light.textMuted,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 20,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        color: Colors.light.text,
    },
    inviteBox: {
        backgroundColor: '#FDFBF7',
        padding: 16,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: Colors.light.border,
        alignItems: 'center',
        marginTop: 8,
        width: '100%',
    },
    inviteLabel: {
        fontFamily: Fonts.bodyBold,
        fontSize: 10,
        color: Colors.light.textMuted,
        letterSpacing: 1,
        marginBottom: 4,
    },
    inviteCode: {
        fontFamily: Fonts.heading,
        fontSize: 22,
        color: Colors.light.primary,
        letterSpacing: 4,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    cardWrapper: {
        padding: 8,
    },
    cardLarge: {
        width: '100%',
        height: 140,
    },
    cardSmall: {
        width: '50%',
        height: 125,
    },
    cardWide: {
        width: '100%',
        height: 80,
    },
    featureCard: {
        flex: 1,
        borderRadius: Layout.radiusLarge,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.light.text,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 0,
        elevation: 3,
    },
    iconBox: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1.5,
        borderColor: Colors.light.text,
    },
    cardText: {
        flex: 1,
    },
    cardTitle: {
        fontFamily: Fonts.heading,
        fontSize: 16,
        color: Colors.light.text,
        letterSpacing: 0.5,
    },
    cardDesc: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.light.textMuted,
        marginTop: 2,
    },
});
