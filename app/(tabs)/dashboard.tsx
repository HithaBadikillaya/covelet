import { CoveCard } from '@/components/Dashboard/CoveCard';
import { CreateCoveModal } from '@/components/Dashboard/CreateCoveModal';
import { JoinCoveModal } from '@/components/Dashboard/JoinCoveModal';
import { Colors, Fonts } from '@/constants/theme';
import { auth, db } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Cove {
    id: string;
    name: string;
    description?: string;
    memberCount: number;
    code: string;
    createdAt?: { seconds: number };
}

const DashboardScreen = () => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const themeColors = Colors[isDark ? 'dark' : 'light'];

    const [coves, setCoves] = useState<Cove[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [joinModalVisible, setJoinModalVisible] = useState(false);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            router.replace('/login');
            return;
        }

        // Real-time listener for Coves where the user is a member
        // Simplified query to avoid requiring composite indexes immediately
        const q = query(
            collection(db, 'coves'),
            where('memberIds', 'array-contains', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const covesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as any)
            })) as Cove[];

            // Sort client-side for now to avoid Firestore index requirement
            const sortedCoves = covesList.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });

            setCoves(sortedCoves);
            setLoading(false);
        }, (error) => {
            console.error("Error listening to coves:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleCovePress = (id: string) => {
        // Future: Navigate to specific Cove features
        console.log("Entering Cove:", id);
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Dashboard', headerShown: false }} />

            <ImageBackground
                source={require('@/assets/images/beach.jpg')}
                style={styles.headerBackground}
                resizeMode="cover"
            >
                <View style={[styles.headerOverlay, { backgroundColor: isDark ? 'rgba(26, 42, 56, 0.8)' : 'rgba(248, 251, 255, 0.7)' }]}>
                    <View style={styles.headerContent}>
                        <Text style={[styles.greeting, { color: themeColors.text }]}>
                            Your Sanctuaries
                        </Text>
                        <Text style={[styles.subGreeting, { color: themeColors.text }]}>
                            Manage your circles and revisited memories.
                        </Text>
                    </View>
                </View>
            </ImageBackground>

            <View style={[styles.content, { backgroundColor: themeColors.background }]}>
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: themeColors.ocean }]}
                        onPress={() => setCreateModalVisible(true)}
                    >
                        <Ionicons name="add" size={24} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Create Cove</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButtonSecondary, { borderColor: themeColors.ocean }]}
                        onPress={() => setJoinModalVisible(true)}
                    >
                        <Ionicons name="enter-outline" size={24} color={themeColors.ocean} />
                        <Text style={[styles.actionButtonTextSecondary, { color: themeColors.ocean }]}>Join Cove</Text>
                    </TouchableOpacity>
                </View>

                {error && (
                    <View style={styles.errorBox}>
                        <Ionicons name="alert-circle-outline" size={24} color="#FF6B6B" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {loading ? (
                    <View style={styles.loaderBox}>
                        <ActivityIndicator size="large" color={themeColors.ocean} />
                    </View>
                ) : coves.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="boat-outline" size={64} color={themeColors.sand} />
                        <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No Coves Yet</Text>
                        <Text style={[styles.emptySubtitle, { color: themeColors.text }]}>
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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerBackground: {
        height: 200,
        justifyContent: 'flex-end',
    },
    headerOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 24,
        paddingBottom: 32,
    },
    headerContent: {
        marginTop: 60,
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
        color: '#FFFFFF',
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
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        padding: 16,
        marginBottom: 24,
        gap: 12,
    },
    errorText: {
        color: '#FF6B6B',
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        flex: 1,
    },
});

export default DashboardScreen;
