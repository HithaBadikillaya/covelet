import { AuthGuard } from '@/components/auth/AuthGuard';
import { Colors, Fonts } from '@/constants/theme';
import { auth, db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { deleteDoc, doc, getDoc } from 'firebase/firestore';
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

export default function CoveSettingsScreen() {
    const { coveId } = useLocalSearchParams<{ coveId: string }>();
    const themeColors = Colors.light; // Or useTheme() hook
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        checkOwnership();
    }, [coveId]);

    const checkOwnership = async () => {
        if (!auth.currentUser || !coveId) return;
        try {
            const coveRef = doc(db, 'coves', coveId);
            const snap = await getDoc(coveRef);
            if (snap.exists() && snap.data().createdBy === auth.currentUser.uid) {
                setIsOwner(true);
            } else {
                Alert.alert("Access Denied", "Only the Cove Owner can access settings.");
                router.back();
            }
        } catch (error) {
            console.error("Error checking ownership:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Cove',
            'This action is permanent. All memories, capsules, and profiles within this Cove will be lost forever.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Forever',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            if (!coveId) return;

                            // 1. Delete Cove Document
                            // Note: Subcollections are NOT automatically deleted by Firestore client SDK.
                            // In a production app, use a Cloud Function triggered by deletion.
                            // For this MVP, we just delete the parent. Be aware of orphaned subcollections.
                            await deleteDoc(doc(db, 'coves', coveId));

                            Alert.alert("Cove Deleted", "The cove has been permanently dissolved.");
                            router.replace('/(tabs)/dashboard');
                        } catch (err: any) {
                            console.error('Error deleting cove:', err);
                            if (err.code === 'permission-denied') {
                                Alert.alert('Permission Denied', 'Only the creator of this Cove can delete it.');
                            } else {
                                Alert.alert('Error', 'Failed to delete Cove.');
                            }
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
        );
    }

    if (!isOwner) return null;

    return (
        <AuthGuard>
            <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="close" size={24} color={themeColors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: themeColors.text }]}>Cove Settings</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>

                    {/* SECTION: GENERAL */}
                    <Text style={styles.sectionTitle}>GENERAL</Text>
                    <View style={styles.section}>
                        <TouchableOpacity style={styles.row}>
                            <Text style={styles.rowLabel}>Edit Details</Text>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.row}>
                            <Text style={styles.rowLabel}>Manage Members</Text>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                    </View>

                    {/* SECTION: DANGER ZONE */}
                    <Text style={[styles.sectionTitle, { marginTop: 32, color: themeColors.error }]}>DANGER ZONE</Text>
                    <View style={[styles.section, { borderColor: themeColors.error }]}>
                        <TouchableOpacity style={styles.row} onPress={handleDelete}>
                            <Text style={[styles.rowLabel, { color: themeColors.error }]}>Delete Cove</Text>
                            <Ionicons name="trash-outline" size={20} color={themeColors.error} />
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </View>
        </AuthGuard>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16, // Modal safety
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 18,
    },
    content: {
        padding: 24,
    },
    sectionTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        color: '#888',
        marginBottom: 8,
        letterSpacing: 1,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    rowLabel: {
        fontFamily: Fonts.body,
        fontSize: 16,
        color: '#333',
    },
});
