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
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    const [cuser, setCUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribeAuth = subscribeToAuthChanges((user) => {
            setCUser(user);
            if (!user) return;

            if (!coveId) {
                setError('No Cove ID provided.');
                setLoading(false);
                return;
            }

            const unsubscribeCove = onSnapshot(doc(db, 'coves', coveId), (snapshot) => {
                if (!snapshot.exists()) {
                    setError('Cove not found.');
                    setLoading(false);
                    return;
                }

                const data = { id: snapshot.id, ...snapshot.data() } as Cove;

                // Security check: must be a member
                if (!data.members.includes(user.uid)) {
                    setError('You are not a member of this Cove.');
                    setLoading(false);
                    return;
                }

                setCove(data);
                setLoading(false);
            }, (err) => {
                console.error("Error fetching cove:", err);
                setError("Access denied or cove not found.");
                setLoading(false);
            });

            return () => unsubscribeCove();
        });

        return () => unsubscribeAuth();
    }, [coveId]);

    const handleDelete = async () => {
        if (!cove || !cuser || cove.createdBy !== cuser.uid) return;

        Alert.alert(
            "Delete Cove",
            "Are you sure you want to permanently delete this digital sanctuary? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'coves', cove.id));
                            router.replace('/(tabs)/dashboard');
                        } catch (err) {
                            Alert.alert("Error", "Failed to delete Cove.");
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
                <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
        );
    }

    if (error || !cove) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: themeColors.background }]}>
                <Ionicons name="alert-circle-outline" size={64} color={themeColors.error} />
                <Text style={[styles.errorText, { color: themeColors.text }]}>{error || 'Something went wrong'}</Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton, { borderColor: themeColors.primary }]}
                >
                    <Text style={[styles.backButtonText, { color: themeColors.primary }]}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isCreator = cove.createdBy === cuser?.uid;
    const formattedDate = cove.createdAt ? new Date(cove.createdAt.seconds * 1000).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : 'Initial Sanctuary';

    return (
        <AuthGuard>
            <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + NAVBAR_HEIGHT + 24 }
                    ]}
                >
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                        </TouchableOpacity>
                        <View style={styles.titleContainer}>
                            <Text style={[styles.title, { color: themeColors.text }]}>{cove.name}</Text>
                            {isCreator && (
                                <View style={[styles.ownerBadge, { borderColor: themeColors.primary }]}>
                                    <Text style={[styles.ownerBadgeText, { color: themeColors.primary }]}>You are the Owner</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <Text style={[styles.description, { color: themeColors.textMuted }]}>
                        {cove.description || 'A sanctuary for shared memories and digital clarity.'}
                    </Text>

                    <View style={[styles.infoCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={20} color={themeColors.primary} />
                            <Text style={[styles.infoLabel, { color: themeColors.text }]}>Established</Text>
                            <Text style={[styles.infoValue, { color: themeColors.textMuted }]}>{formattedDate}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="people-outline" size={20} color={themeColors.primary} />
                            <Text style={[styles.infoLabel, { color: themeColors.text }]}>Members</Text>
                            <Text style={[styles.infoValue, { color: themeColors.textMuted }]}>{cove.members.length}</Text>
                        </View>
                    </View>

                    {isCreator && (
                        <View style={[styles.ownerCard, { backgroundColor: themeColors.card, borderColor: themeColors.primary + '40' }]}>
                            <Text style={[styles.ownerCardTitle, { color: themeColors.primary }]}>Sanctuary Management</Text>
                            <View style={styles.codeContainer}>
                                <Text style={[styles.codeLabel, { color: themeColors.text }]}>Join Code</Text>
                                <View style={[styles.codeBox, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                                    <Text style={[styles.codeText, { color: themeColors.primary }]}>{cove.joinCode}</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.deleteButton, { borderColor: themeColors.error }]}
                                onPress={handleDelete}
                            >
                                <Ionicons name="trash-outline" size={20} color={themeColors.error} />
                                <Text style={[styles.deleteButtonText, { color: themeColors.error }]}>Delete Cove</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </View>
        </AuthGuard>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 18,
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    backButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderWidth: 1,
    },
    backButtonText: {
        fontFamily: Fonts.heading,
        fontSize: 16,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 16,
    },
    iconButton: {
        padding: 4,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 32,
        lineHeight: 38,
    },
    ownerBadge: {
        alignSelf: 'flex-start',
        marginTop: 4,
        borderBottomWidth: 1,
    },
    ownerBadgeText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    description: {
        fontFamily: Fonts.body,
        fontSize: 18,
        lineHeight: 28,
        marginBottom: 32,
    },
    infoCard: {
        padding: 24,
        borderWidth: 1,
        marginBottom: 32,
        gap: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoLabel: {
        flex: 1,
        fontFamily: Fonts.bodyMedium,
        fontSize: 16,
    },
    infoValue: {
        fontFamily: Fonts.body,
        fontSize: 16,
    },
    ownerCard: {
        padding: 24,
        borderWidth: 1,
        gap: 24,
    },
    ownerCardTitle: {
        fontFamily: Fonts.heading,
        fontSize: 18,
        marginBottom: 8,
    },
    codeContainer: {
        gap: 12,
    },
    codeLabel: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    codeBox: {
        height: 64,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    codeText: {
        fontFamily: Fonts.heading,
        fontSize: 32,
        letterSpacing: 8,
    },
    deleteButton: {
        flexDirection: 'row',
        height: 56,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    deleteButtonText: {
        fontFamily: Fonts.heading,
        fontSize: 16,
    },
});
