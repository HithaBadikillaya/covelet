import { AuthGuard } from '@/components/auth/AuthGuard';
import { subscribeToAuthChanges } from '@/components/auth/authService';
import { CoveCard } from '@/components/Dashboard/CoveCard';
import { CreateCoveModal } from '@/components/Dashboard/CreateCoveModal';
import { JoinCoveModal } from '@/components/Dashboard/JoinCoveModal';
import { Colors, Fonts } from '@/constants/theme';
import { db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { User } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Cove {
    id: string;
    name: string;
    description?: string;
    memberCount: number;
    code: string;
    createdAt?: { seconds: number };
}

const DashboardScreen = () => {
    const themeColors = Colors.light; // Single theme

    const [coves, setCoves] = useState<Cove[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [joinModalVisible, setJoinModalVisible] = useState(false);

    useEffect(() => {
        const unsubscribeAuth = subscribeToAuthChanges((user: User | null) => {
            if (!user) {
                return; // AuthGuard handles redirect
            }

            // Real-time listener for Coves where the user is a member
            const q = query(
                collection(db, 'coves'),
                where('memberIds', 'array-contains', user.uid)
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
            }, (error) => {
                console.error("Error listening to coves:", error);
                if (error.message.includes('permissions')) {
                    setError("Firestore Permission Denied. Please ensure your Firestore Rules allow 'read' for authenticated users.");
                }
                setLoading(false);
            });

            return () => unsubscribeCoves();
        });

        return () => unsubscribeAuth();
    }, []);

    const handleCovePress = (id: string) => {
        // Future: Navigate to specific Cove features
        console.log("Entering Cove:", id);
    };

    return (
        <AuthGuard>
            <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                <Stack.Screen options={{ title: 'Dashboard', headerShown: false }} />

                <View style={[styles.header, { backgroundColor: themeColors.card }]}>
                    <View style={styles.headerContent}>
                        <Text style={[styles.greeting, { color: themeColors.text }]}>
                            Your Sanctuaries
                        </Text>
                        <Text style={[styles.subGreeting, { color: themeColors.textMuted }]}>
                            Manage your circles and revisited memories.
                        </Text>
                    </View>
                </View>

                <View style={[styles.content, { backgroundColor: themeColors.background }]}>
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: themeColors.primary }]}
                            onPress={() => setCreateModalVisible(true)}
                        >
                            <Ionicons name="add" size={24} color={themeColors.background} />
                            <Text style={[styles.actionButtonText, { color: themeColors.background }]}>Create Cove</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButtonSecondary, { borderColor: themeColors.primary }]}
                            onPress={() => setJoinModalVisible(true)}
                        >
                            <Ionicons name="enter-outline" size={24} color={themeColors.primary} />
                            <Text style={[styles.actionButtonTextSecondary, { color: themeColors.primary }]}>Join Cove</Text>
                        </TouchableOpacity>
                    </View>

                    {error && (
                        <View style={[styles.errorBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: themeColors.error }]}>
                            <Ionicons name="alert-circle-outline" size={24} color={themeColors.error} />
                            <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
                        </View>
                    )}

                    {loading ? (
                        <View style={styles.loaderBox}>
                            <ActivityIndicator size="large" color={themeColors.primary} />
                        </View>
                    ) : coves.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="boat-outline" size={64} color={themeColors.muted} />
                            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No Coves Yet</Text>
                            <Text style={[styles.emptySubtitle, { color: themeColors.textMuted }]}>
                                Create your own circle or join one using a code shared by a friend.
                            </Text>
                        </View>
                    ) : (
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollList}
                        >
                            {coves.map((cove) => (
                                <CoveCard
                                    key={cove.id}
                                    name={cove.name}
                                    description={cove.description}
                                    memberCount={cove.memberCount || 1}
                                    code={cove.code}
                                    onPress={() => handleCovePress(cove.id)}
                                />
                            ))}
                        </ScrollView>
                    )}
                </View>

                <CreateCoveModal
                    visible={createModalVisible}
                    onClose={() => setCreateModalVisible(false)}
                />
                <JoinCoveModal
                    visible={joinModalVisible}
                    onClose={() => setJoinModalVisible(false)}
                />
            </View>
        </AuthGuard>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 80,
        paddingHorizontal: 24,
        paddingBottom: 32,
    },
    headerContent: {
        // No margin needed
    },
    greeting: {
        fontFamily: Fonts.heading,
        fontSize: 32,
        marginBottom: 8,
    },
    subGreeting: {
        fontFamily: Fonts.body,
        fontSize: 16,
        opacity: 0.8,
    },
    content: {
        flex: 1,
        borderTopLeftRadius: 0, // Enforce sharp edges
        marginTop: -20,
        paddingHorizontal: 24,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
        marginTop: 32,
    },
    actionButton: {
        flex: 1,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    actionButtonSecondary: {
        flex: 1,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
    },
    actionButtonText: {
        fontFamily: Fonts.heading,
        fontSize: 16,
    },
    actionButtonTextSecondary: {
        fontFamily: Fonts.heading,
        fontSize: 16,
    },
    scrollList: {
        paddingBottom: 100,
    },
    loaderBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        opacity: 0.6,
    },
    emptyTitle: {
        fontFamily: Fonts.heading,
        fontSize: 24,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontFamily: Fonts.body,
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 24,
        gap: 12,
        borderWidth: 1,
    },
    errorText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        flex: 1,
    },
});

export default DashboardScreen;
