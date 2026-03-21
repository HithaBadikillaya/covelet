import { subscribeToAuthChanges } from '@/components/auth/authService';
import CoveCard from '@/components/Dashboard/CoveCard';
import CreateCoveModal from '@/components/Dashboard/CreateCoveModal';
import JoinCoveModal from '@/components/Dashboard/JoinCoveModal';
import { Colors, Fonts, Layout } from '@/constants/theme';
import { ensureCoveJoinCodeIndex } from '@/utils/coveJoinCodes';
import { db } from '@/firebaseConfig';
import { NAVBAR_HEIGHT } from '@/components/Navbar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { User } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    AppState,
    FlatList,
    RefreshControl,
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

const DashboardScreen = () => {
    const insets = useSafeAreaInsets();
    const [cuser, setCUser] = useState<User | null>(null);
    const [firstName, setFirstName] = useState<string>('');
    const [coves, setCoves] = useState<Cove[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribeAuth = subscribeToAuthChanges((user: User | null) => {
            setCUser(user);
            if (!user) {
                setLoading(false);
                setCoves([]);
                setFirstName('');
                return;
            }

            if (!db) {
                console.error('Dashboard: Firestore not initialized');
                setLoading(false);
                return;
            }

            console.log('Dashboard: Fetching profile for user:', user.uid);
            // Fetch user profile for first name
            const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
                if (snap.exists()) {
                    const data = snap.data() as { name?: string };
                    const name = data.name || '';
                    console.log('Dashboard: Profile received, name:', name);
                    setFirstName(name.split(' ')[0] || '');
                } else {
                    console.warn('Dashboard: Profile not found for UID:', user.uid);
                }
            }, (err) => {
                console.error('Dashboard: Profile listener error:', err);
                // We don't necessarily stop loading here, as coves are more important
            });

            console.log('Dashboard: Subscribing to coves for user:', user.uid);
            const q = query(
                collection(db, 'coves'),
                where('members', 'array-contains', user.uid)
            );

            const unsubscribeCoves = onSnapshot(q, (snapshot) => {
                console.log('Dashboard: Coves received, count:', snapshot.size);
                const covesList = snapshot.docs.map(d => ({
                    id: d.id,
                    ...(d.data() as any)
                })) as Cove[];

                const sortedCoves = covesList.sort((a, b) => {
                    const dateA = a.createdAt?.seconds || 0;
                    const dateB = b.createdAt?.seconds || 0;
                    return dateB - dateA;
                });

                setCoves(sortedCoves);
                setLoading(false);
                setError(null);
            }, (err) => {
                console.error("Dashboard: Coves listener error:", err);
                setError("Failed to sync your scrapbook. Please check your connection.");
                setLoading(false);
            });

            return () => {
                console.log('Dashboard: Unsubscribing from listeners');
                unsubscribeProfile();
                unsubscribeCoves();
            };
        });

        return () => unsubscribeAuth();
    }, []);

    // AppState listener for rehydration
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            console.log("Dashboard: App state changed to:", nextState);
            if (nextState === 'active') {
                console.log("Dashboard: App resumed, verifying data...");
                if (cuser && coves.length === 0 && !loading) {
                    console.log("Dashboard: Data missing on resume, forcing reload");
                    setLoading(true);
                }
            }
        });
        return () => subscription.remove();
    }, [cuser, coves, loading]);

    useEffect(() => {
        if (coves.length === 0) {
            return;
        }

        void Promise.allSettled(
            coves.map((cove) => ensureCoveJoinCodeIndex(cove.id, cove.joinCode, cove.createdBy))
        );
    }, [coves]);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 800);
    };

    const handleCovePress = (id: string) => {
        console.log("[TRACE] Dashboard: Cove card pressed", id);
        router.push(`/dashboard/cove/${id}` as any);
    };

    const handleCoveCreated = (id: string) => {
        console.log("[TRACE] Dashboard: Cove created, navigating to:", id);
        router.replace(`/dashboard/cove/${id}` as any);
    };

    const renderBentoGrid = () => {
        if (loading && !refreshing) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={24} color={Colors.light.error} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            );
        }

        if (coves.length === 0) {
            console.log("Dashboard: Render empty state. Loading:", loading, "Error:", error);
            return (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIllustration}>
                        <Ionicons name="images-outline" size={64} color={Colors.light.border} />
                    </View>
                    <Text style={styles.emptyTitle}>Your scrapbook is empty</Text>
                    <Text style={styles.emptySubtitle}>
                        Every story starts with a first page. Create a cove to begin sharing memories.
                    </Text>
                    {!loading && (
                        <TouchableOpacity 
                            onPress={() => onRefresh()}
                            style={[styles.retryButton, { marginTop: 20 }]}
                        >
                            <Text style={styles.retryText}>REFRESH</Text>
                        </TouchableOpacity>
                    )}
                </View>
            );
        }

        return (
            <View style={styles.gridContainer}>
                {coves.map((cove, index) => {
                    return (
                        <View
                            key={cove.id}
                            style={styles.gridItem}
                        >
                            <CoveCard
                                cove={cove}
                                index={index}
                                isOwner={cuser?.uid === cove.createdBy}
                                onPress={() => handleCovePress(cove.id)}
                            />
                        </View>
                    );
                })}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + NAVBAR_HEIGHT + 18 }]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.light.primary}
                    />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.greeting}>
                        {firstName ? `HEY, ${firstName.toUpperCase()}!` : 'HEY THERE!'}
                    </Text>
                    <Text style={styles.title}>SCRAPBOOK</Text>
                </View>

                <View style={styles.ctaRow}>
                    <TouchableOpacity
                        onPress={() => setShowCreateModal(true)}
                        activeOpacity={0.85}
                        style={styles.createBtn}
                    >
                        <Ionicons name="add" size={24} color="#FFFFFF" />
                        <Text style={styles.ctaText}>CREATE</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setShowJoinModal(true)}
                        activeOpacity={0.85}
                        style={styles.joinBtn}
                    >
                        <Ionicons name="people" size={22} color="#2F2E2C" />
                        <Text style={[styles.ctaText, { color: '#2F2E2C' }]}>JOIN</Text>
                    </TouchableOpacity>
                </View>

                {renderBentoGrid()}
            </ScrollView>

            <CreateCoveModal
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCoveCreated}
            />
            <JoinCoveModal
                visible={showJoinModal}
                onClose={() => setShowJoinModal(false)}
                onJoin={(id) => router.push(`/dashboard/cove/${id}` as any)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 60,
    },
    header: {
        marginBottom: 28,
        marginTop: 10,
    },
    greeting: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 15,
        color: Colors.light.textMuted,
        marginBottom: -4,
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 34,
        color: Colors.light.text,
        letterSpacing: 1,
    },
    ctaRow: {
        flexDirection: 'row',
        marginBottom: 32,
        gap: 12,
        width: '100%',
        justifyContent: 'space-between',
    },
    createBtn: {
        width: '48.5%',
        flexDirection: 'row',
        height: 56,
        borderRadius: 0,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2.5,
        borderColor: '#2F2E2C', // Explicit hex
        backgroundColor: '#4A6741', // Explicit Green hex
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 0,
        elevation: 4,
    },
    joinBtn: {
        width: '48.5%',
        flexDirection: 'row',
        height: 56,
        borderRadius: 0,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2.5,
        borderColor: '#2F2E2C', // Explicit hex
        backgroundColor: '#FFFFFF', // Explicit White hex
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 0,
        elevation: 4,
    },
    ctaPressed: {
        transform: [{ translateX: 2 }, { translateY: 2 }],
        shadowOffset: { width: 2, height: 2 },
    },
    ctaText: {
        fontFamily: Fonts.heading,
        fontSize: 15,
        color: '#FFFFFF',
        marginLeft: 8,
        letterSpacing: 1,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -10,
    },
    gridItem: {
        width: '100%',
        paddingHorizontal: 10,
    },
    loadingContainer: {
        paddingVertical: 100,
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyIllustration: {
        width: 100,
        height: 100,
        borderRadius: 0,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: Colors.light.border,
    },
    emptyTitle: {
        fontFamily: Fonts.heading,
        fontSize: 22,
        color: Colors.light.text,
        marginBottom: 8,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    emptySubtitle: {
        fontFamily: Fonts.body,
        fontSize: 15,
        color: Colors.light.textMuted,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 32,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderColor: Colors.light.error,
        borderWidth: 2,
        borderRadius: 0,
        marginBottom: 24,
        gap: 12,
    },
    errorText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: Colors.light.error,
        flex: 1,
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

export default DashboardScreen;
