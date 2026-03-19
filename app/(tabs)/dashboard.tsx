import { subscribeToAuthChanges } from '@/components/auth/authService';
import CoveCard from '@/components/Dashboard/CoveCard';
import CreateCoveModal from '@/components/Dashboard/CreateCoveModal';
import JoinCoveModal from '@/components/Dashboard/JoinCoveModal';
import { Colors, Fonts, Layout } from '@/constants/theme';
import { ensureCoveJoinCodeIndex } from '@/utils/coveJoinCodes';
import { db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { User } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
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
}

const DashboardScreen = () => {
    const insets = useSafeAreaInsets();
    const [cuser, setCUser] = useState<User | null>(null);
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
                return;
            }

            const q = query(
                collection(db, 'coves'),
                where('members', 'array-contains', user.uid)
            );

            const unsubscribeCoves = onSnapshot(q, (snapshot) => {
                const covesList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...(doc.data() as any)
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
                console.error("Dashboard listener error:", err);
                setError("Failed to sync your scrapbook. Please check your connection.");
                setLoading(false);
            });

            return () => unsubscribeCoves();
        });

        return () => unsubscribeAuth();
    }, []);

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
        router.push(`/dashboard/cove/${id}` as any);
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
            return (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIllustration}>
                        <Ionicons name="images-outline" size={64} color={Colors.light.border} />
                    </View>
                    <Text style={styles.emptyTitle}>Your scrapbook is empty</Text>
                    <Text style={styles.emptySubtitle}>
                        Every story starts with a first page. Create a cove to begin sharing memories.
                    </Text>
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
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <FlatList
                data={[]}
                renderItem={null}
                ListHeaderComponent={
                    <>
                        <View style={styles.header}>
                            <Text style={styles.greeting}>Hey there!</Text>
                            <Text style={styles.title}>MY SCRAPBOOK</Text>
                        </View>

                        <View style={styles.ctaRow}>
                            <Pressable
                                onPress={() => setShowCreateModal(true)}
                                style={({ pressed }) => [
                                    styles.ctaButton, 
                                    styles.createBtn, 
                                    { flex: 1.2 },
                                    pressed && styles.ctaPressed
                                ]}
                            >
                                <Ionicons name="add" size={24} color="#FFFFFF" />
                                <Text style={styles.ctaText}>CREATE COVE</Text>
                            </Pressable>

                            <Pressable
                                onPress={() => setShowJoinModal(true)}
                                style={({ pressed }) => [
                                    styles.ctaButton, 
                                    styles.joinBtn, 
                                    { flex: 1 },
                                    pressed && styles.ctaPressed
                                ]}
                            >
                                <Ionicons name="people" size={22} color={Colors.light.text} />
                                <Text style={[styles.ctaText, { color: Colors.light.text }]}>JOIN</Text>
                            </Pressable>
                        </View>

                        {renderBentoGrid()}
                    </>
                }
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.light.primary}
                    />
                }
            />

            <CreateCoveModal
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
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
        paddingBottom: 40,
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
    },
    ctaButton: {
        flexDirection: 'row',
        height: 56,
        borderRadius: Layout.radiusMedium,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.light.text,
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
    createBtn: {
        backgroundColor: Colors.light.primary,
        borderColor: Colors.light.text,
    },
    joinBtn: {
        backgroundColor: '#FFFFFF',
    },
    ctaText: {
        fontFamily: Fonts.heading,
        fontSize: 14,
        color: '#FFFFFF',
        marginLeft: 8,
        letterSpacing: 0.5,
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
});

export default DashboardScreen;
