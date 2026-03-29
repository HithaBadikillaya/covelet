import { subscribeToAuthChanges } from '@/components/auth/authService';
import { NAVBAR_HEIGHT } from '@/components/Navbar';
import { getCoveBackgroundUrl } from '@/utils/avatar';
import { Image } from 'expo-image';
import { Colors, Fonts, Layout } from '@/constants/theme';
import { db } from '@/firebaseConfig';
import { logger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { User } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import React, { useEffect, useState, useCallback } from 'react';
import {
    ActivityIndicator,
    AppState,
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
    avatarSeed?: string;
}

export default function CoveScreen() {
    const { coveId } = useLocalSearchParams<{ coveId: string }>();
    const insets = useSafeAreaInsets();
    const isFocused = useIsFocused();
    const [cove, setCove] = useState<Cove | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingStage, setLoadingStage] = useState('Initializing...');
    const [timedOut, setTimedOut] = useState(false);
    const safetyTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        logger.log("[TRACE] CoveScreen: Mounted", { coveId });
        
        if (!coveId) {
            logger.error('[TRACE] CoveScreen: Invalid coveId (undefined/null)');
            setLoadingStage('Invalid Sanctuary ID');
            setTimedOut(true);
            setLoading(false);
            return;
        }

        // 1. Start Safety Timer
        if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = setTimeout(() => {
            logger.warn('[TRACE] CoveScreen: 5s Safety Timeout triggered');
            setLoadingStage('Timeout reached');
            setTimedOut(true);
            setLoading(false);
        }, 5000); 

        let unsubFirestore: (() => void) | null = null;
        
        const unsubAuth = subscribeToAuthChanges(async (authUser) => {
            try {
                if (!authUser || !db) {
                    logger.warn('[TRACE] CoveScreen: Auth/DB missing on callback');
                    setLoadingStage(db ? 'Please log in' : 'DB Offline');
                    return;
                }

                logger.log("[TRACE] CoveScreen: Auth found:", authUser.uid);
                setUser(authUser);
                setLoadingStage(`Fetching...`);
                
                if (unsubFirestore) unsubFirestore();
                
                const coveRef = doc(db, 'coves', coveId);

                // 3. Initial Fetch
                logger.log("[TRACE] CoveScreen: Fetch START", { coveId });
                try {
                    const snap = await getDoc(coveRef);
                    logger.log("[TRACE] CoveScreen: Fetch RESPONSE", snap.exists() ? "DOC_FOUND" : "DOC_MISSING");
                    
                    if (snap.exists()) {
                        const rawData = snap.data();
                        const members = Array.isArray(rawData?.members) ? rawData.members : [];
                        const isMember = members.includes(authUser.uid);
                        
                        logger.log("[TRACE] CoveScreen: Membership check (Initial)", {
                            docId: snap.id,
                            userUid: authUser.uid,
                            members: members,
                            isMember: isMember
                        });

                        if (isMember) {
                            const data = { id: snap.id, ...rawData } as Cove;
                            logger.log("[TRACE] CoveScreen: Setting Cove state", data.name);
                            setCove(data);
                            setLoading(false);
                            setTimedOut(false);
                        } else {
                            logger.warn("[TRACE] CoveScreen: User found but NOT A MEMBER of this sanctuary");
                            setLoadingStage('Not a member');
                            setLoading(false);
                        }
                    } else {
                        logger.error("[TRACE] CoveScreen: Document NOT FOUND in Firestore", coveId);
                        setLoadingStage('Not found');
                        setTimedOut(true);
                    }
                } catch (fetchErr) {
                    logger.error("[TRACE] CoveScreen: Fetch ERROR", fetchErr);
                    setLoadingStage('Fetch failed');
                    setTimedOut(true);
                } finally {
                    setLoading(false);
                }

                // 4. Subscription
                unsubFirestore = onSnapshot(coveRef, (snap) => {
                    logger.log('[TRACE] CoveScreen: Snapshot sync', snap.exists() ? "DOC_FOUND" : "DOC_MISSING");
                    
                    if (!snap.exists()) {
                        setTimedOut(true);
                        setLoading(false);
                        return;
                    }

                    const rawData = snap.data();
                    const data = { id: snap.id, ...rawData } as Cove;
                    const isMember = Array.isArray(data.members) && data.members.includes(authUser.uid);

                    logger.log("[TRACE] CoveScreen: Membership check (Sync)", {
                        isMember: isMember,
                        memberCount: data.members?.length
                    });

                    if (isMember) {
                        if (safetyTimerRef.current) {
                            clearTimeout(safetyTimerRef.current);
                            safetyTimerRef.current = null;
                        }
                        logger.log("[TRACE] CoveScreen: State Update (Sync)", data.name);
                        setCove(data);
                        setLoading(false);
                        setTimedOut(false);
                    } else {
                        logger.warn("[TRACE] CoveScreen: Snapshot received but user no longer a member");
                        // Optional: redirect to dashboard
                        // router.replace('/(tabs)/dashboard');
                    }
                }, (err) => {
                    logger.error("[TRACE] CoveScreen: Subscription ERROR", err);
                    setLoading(false);
                    setTimedOut(true);
                });
            } catch (outerErr) {
                logger.error("[TRACE] CoveScreen: Critical Error", outerErr);
                setLoading(false);
                setTimedOut(true);
            }
        });

        return () => {
            unsubAuth();
            if (unsubFirestore) unsubFirestore();
            if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
        };
    }, [coveId, isFocused]); // Re-fetch when screen focused

    // AppState listener for rehydration
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            logger.log("CoveScreen: App state changed to:", nextState);
            if (nextState === 'active') {
                logger.log("CoveScreen: App resumed, verifying sanctuary data...");
                if (user && !cove && !loading) {
                    logger.log("CoveScreen: Data missing on resume, forcing reload");
                    setLoading(true);
                    // The useEffect above will naturally re-run or we can trigger it
                }
            }
        });
        return () => subscription.remove();
    }, [user, cove, loading]);

    // Error / Timeout UI
    if (timedOut && (!cove || !user)) {
        logger.log("[TRACE] CoveScreen: Rendering TIMEOUT_UI");
        return (
            <View style={[styles.loading, { paddingTop: insets.top + 20 }]}>
                <TouchableOpacity
                    onPress={() => router.replace('/(tabs)/dashboard')}
                    style={[styles.backButton, { position: 'absolute', top: insets.top + 20, left: 20 }]}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
                </TouchableOpacity>

                <Ionicons name="cloud-offline-outline" size={48} color={Colors.light.textMuted} />
                <Text style={styles.errorText}>
                    {loadingStage.includes('error') ? 'Network connection failed.' : 'Sanctuary connection timed out.'}
                </Text>
                <Text style={[styles.errorText, { fontSize: 13, marginTop: -16, opacity: 0.6 }]}>
                    Status: {loadingStage}
                </Text>
                <TouchableOpacity 
                    onPress={() => router.replace('/(tabs)/dashboard')}
                    style={styles.retryButton}
                    activeOpacity={0.7}
                >
                    <Text style={styles.retryText}>Return to Dashboard</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Spinner UI
    if (loading || (!cove && !timedOut)) {
        logger.log("[TRACE] CoveScreen: Rendering SPINNER_UI", { loading, hasCove: !!cove, timedOut });
        return (
            <View style={[styles.loading, { paddingTop: insets.top + 20 }]}>
                 <TouchableOpacity
                    onPress={() => router.replace('/(tabs)/dashboard')}
                    style={[styles.backButton, { position: 'absolute', top: insets.top + 20, left: 20 }]}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
                </TouchableOpacity>

                <ActivityIndicator size="large" color={Colors.light.primary} />
                <Text style={[styles.errorText, { fontSize: 14, opacity: 0.5, marginTop: 12 }]}>{loadingStage}</Text>
            </View>
        );
    }

    // Backup Error UI (loading false but no cove/user and not timed out)
    if (!cove || !user) {
        logger.log("[TRACE] CoveScreen: Rendering BACKUP_ERROR_UI", { hasCove: !!cove, hasUser: !!user });
        return (
            <View style={[styles.loading, { paddingTop: insets.top + 20 }]}>
                <TouchableOpacity
                    onPress={() => router.replace('/(tabs)/dashboard')}
                    style={[styles.backButton, { position: 'absolute', top: insets.top + 20, left: 20 }]}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
                </TouchableOpacity>

                <Ionicons name="alert-circle-outline" size={48} color={Colors.light.error} />
                <Text style={styles.errorText}>Oops! We couldn't find this sanctuary.</Text>
                <TouchableOpacity 
                    onPress={() => router.replace('/(tabs)/dashboard')}
                    style={styles.retryButton}
                >
                    <Text style={styles.retryText}>Return to Dashboard</Text>
                </TouchableOpacity>
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

    if (!cove || !user) {
        logger.warn("CoveScreen: Rendering bailout - cove:", !!cove, "user:", !!user);
        return null; // Should be handled by Backup Error UI above
    }

    logger.log("[TRACE] CoveScreen: Rendering MAIN_CONTENT", cove.name);

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
                <TouchableOpacity
                    onPress={() => router.replace('/(tabs)/dashboard')}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
                </TouchableOpacity>

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
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[
                styles.cardWrapper,
                size === 'large' && styles.cardLarge,
                size === 'wide' && styles.cardWide,
                size === 'small' && styles.cardSmall,
            ]}
        >
            <View
                style={[
                    styles.featureCard,
                    isSmall && { flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
                    {
                        backgroundColor: '#FFFFFF',
                        borderColor: '#2F2E2C', // Explicit Deep Charcoal
                        borderWidth: 2.5,
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
        </TouchableOpacity>
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
        padding: 12,
        paddingBottom: 48,
        borderRadius: 0,
        borderWidth: 2.5, // Thicker
        borderColor: '#2F2E2C', // Deep Charcoal explicit
        shadowColor: '#000',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 0,
        elevation: 6,
        overflow: 'hidden',
    },
    cardPressed: {
        backgroundColor: '#FDFBF7',
        transform: [{ translateX: 2 }, { translateY: 2 }],
        shadowOffset: { width: 2, height: 2 },
    },
    tape: {
        position: 'absolute',
        top: -10,
        alignSelf: 'center',
        width: 80,
        height: 22,
        zIndex: 10,
        backgroundColor: '#D4A373', // Explicit secondary
        opacity: 0.7,
    },
    photoArea: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#F9F7F2',
        borderRadius: 0,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2, // Thicker
        borderColor: '#E8E2D9', // Subtle explicit
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
        width: '100%', // FORCE WIDTH
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
        borderRadius: 0, // Sharp corners
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2.5,
        borderColor: '#2F2E2C',
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.12,
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
    errorText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 16,
        color: Colors.light.text,
        marginTop: 16,
        marginBottom: 24,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: Colors.light.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 0,
        borderWidth: 2,
        borderColor: Colors.light.text,
    },
    retryText: {
        fontFamily: Fonts.heading,
        fontSize: 14,
        color: '#FFFFFF',
    },
});
