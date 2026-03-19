import { EditCoveModal } from '@/components/Settings/EditCoveModal';
import { ManageMembersModal } from '@/components/Settings/ManageMembersModal';
import AppDialog, { type AppDialogAction } from '@/components/ui/AppDialog';
import { Colors, Fonts, Layout } from '@/constants/theme';
import { auth, db } from '@/firebaseConfig';
import { deleteCoveWithJoinCode } from '@/utils/coveJoinCodes';
import { getCoveBackgroundUrl } from '@/utils/avatar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CoveData {
    name: string;
    description?: string;
    avatarSeed?: string;
    members: string[];
    createdBy: string;
    joinCode?: string;
}

type DialogState = {
    title: string;
    message: string;
    actions?: AppDialogAction[];
} | null;

export default function CoveSettingsScreen() {
    const params = useLocalSearchParams<{ coveId: string | string[] }>();
    const coveId = Array.isArray(params.coveId) ? params.coveId[0] : params.coveId;
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [coveData, setCoveData] = useState<CoveData | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [manageModalVisible, setManageModalVisible] = useState(false);
    const [dialog, setDialog] = useState<DialogState>(null);

    const showDialog = (title: string, message: string, actions?: AppDialogAction[]) => {
        setDialog({ title, message, actions });
    };

    useEffect(() => {
        if (!auth.currentUser || !coveId) return;

        const coveRef = doc(db, 'coves', coveId);
        const unsub = onSnapshot(
            coveRef,
            (snap) => {
                if (snap.exists()) {
                    const data = snap.data() as CoveData;
                    if (data.createdBy === auth.currentUser?.uid) {
                        setCoveData(data);
                        setIsOwner(true);
                    } else {
                        setIsOwner(false);
                        showDialog('Access Denied', 'Only the Cove Owner can access settings.', [
                            { label: 'OK', onPress: () => router.back() },
                        ]);
                    }
                } else {
                    router.back();
                }
                setLoading(false);
            },
            (err) => {
                console.error('Error subscribing to cove:', err);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [coveId]);

    const coveBackgroundUrl = coveData?.avatarSeed ? getCoveBackgroundUrl(coveData.avatarSeed) : null;

    const handleDelete = () => {
        showDialog('Dissolve Cove', 'This action is permanent. All shared memories and capsules will be lost forever.', [
            { label: 'Cancel', variant: 'secondary' },
            {
                label: 'Delete Forever',
                variant: 'danger',
                onPress: async () => {
                    try {
                        setLoading(true);
                        if (!coveId) return;
                        await deleteCoveWithJoinCode(coveId, coveData?.joinCode);
                        showDialog('Cove Dissolved', 'The digital sanctuary has been removed.', [
                            { label: 'OK', onPress: () => router.replace('/(tabs)/dashboard') },
                        ]);
                    } catch (err: any) {
                        console.error('Error deleting cove:', err);
                        setLoading(false);
                        showDialog('Error', 'Failed to delete Cove.');
                    }
                },
            },
        ]);
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
        );
    }

    if (!coveId) return null;

    return (
        <View style={[styles.container, { backgroundColor: Colors.light.background }]}>
            {isOwner && coveData ? (
                <>
                    <View style={[styles.header, { paddingTop: Math.max(insets.top + 12, 24) }]}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtnSquare}>
                            <Ionicons name="close" size={24} color={Colors.light.text} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>COVE SETTINGS</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <ScrollView contentContainerStyle={[styles.content, { paddingTop: 8 }]} showsVerticalScrollIndicator={false}>
                        <View style={styles.previewCard}>
                            {coveBackgroundUrl ? (
                                <Image
                                    source={{ uri: coveBackgroundUrl }}
                                    style={styles.previewBg}
                                    contentFit="cover"
                                />
                            ) : null}
                            <View style={styles.previewOverlay}>
                                <Text style={styles.previewEyebrow}>CURRENT COVE DETAILS</Text>
                                <Text style={styles.previewTitle}>{coveData.name}</Text>
                                <Text style={styles.previewDescription}>
                                    {coveData.description?.trim() || 'No description added yet.'}
                                </Text>

                                <View style={styles.previewStatsRow}>
                                    <View style={styles.previewStatChip}>
                                        <Ionicons name="people-outline" size={14} color={Colors.light.text} />
                                        <Text style={styles.previewStatText}>{coveData.members?.length || 0} members</Text>
                                    </View>
                                    {coveData.joinCode ? (
                                        <View style={styles.previewStatChip}>
                                            <Ionicons name="key-outline" size={14} color={Colors.light.text} />
                                            <Text style={styles.previewStatText}>{coveData.joinCode}</Text>
                                        </View>
                                    ) : null}
                                </View>
                            </View>
                        </View>

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>GENERAL</Text>
                        </View>
                        <View style={styles.section}>
                            <TouchableOpacity style={styles.row} onPress={() => setEditModalVisible(true)} activeOpacity={0.7}>
                                <View style={styles.rowLeft}>
                                    <View style={[styles.iconBox, { backgroundColor: '#F0F4EF' }]}>
                                        <Ionicons name="create-outline" size={20} color={Colors.light.primary} />
                                    </View>
                                    <View style={styles.rowTextWrap}>
                                        <Text style={styles.rowLabel}>Edit Cove Details</Text>
                                        <Text style={styles.rowHint}>Name, description, and avatar theme</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.row, styles.lastRow]} onPress={() => setManageModalVisible(true)} activeOpacity={0.7}>
                                <View style={styles.rowLeft}>
                                    <View style={[styles.iconBox, { backgroundColor: '#FDF7F2' }]}>
                                        <Ionicons name="people-outline" size={20} color="#D97706" />
                                    </View>
                                    <View style={styles.rowTextWrap}>
                                        <Text style={styles.rowLabel}>Manage Members</Text>
                                        <Text style={styles.rowHint}>View everyone and remove members if needed</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: Colors.light.error }]}>DANGER ZONE</Text>
                        </View>
                        <View style={[styles.section, { borderColor: Colors.light.error }]}>
                            <TouchableOpacity style={[styles.row, styles.lastRow]} onPress={handleDelete} activeOpacity={0.7}>
                                <View style={styles.rowLeft}>
                                    <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
                                        <Ionicons name="trash-outline" size={20} color={Colors.light.error} />
                                    </View>
                                    <View style={styles.rowTextWrap}>
                                        <Text style={[styles.rowLabel, { color: Colors.light.error }]}>Delete Cove</Text>
                                        <Text style={styles.rowHint}>Permanently remove the cove and everything in it</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={Colors.light.error} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                You are the owner of this sanctuary. Changes here affect everyone in the cove.
                            </Text>
                        </View>
                    </ScrollView>

                    <EditCoveModal
                        visible={editModalVisible}
                        onClose={() => setEditModalVisible(false)}
                        coveId={coveId}
                        initialName={coveData.name}
                        initialDescription={coveData.description || ''}
                        initialAvatarSeed={coveData.avatarSeed || ''}
                    />

                    <ManageMembersModal
                        visible={manageModalVisible}
                        onClose={() => setManageModalVisible(false)}
                        coveId={coveId}
                    />
                </>
            ) : null}

            <AppDialog
                visible={!!dialog}
                title={dialog?.title || ''}
                message={dialog?.message || ''}
                actions={dialog?.actions}
                onClose={() => setDialog(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    closeBtnSquare: {
        width: 44,
        height: 44,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.light.text,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
        elevation: 2,
    },
    headerTitle: {
        fontFamily: Fonts.heading,
        fontSize: 18,
        color: Colors.light.text,
        letterSpacing: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    previewCard: {
        minHeight: 220,
        borderRadius: Layout.radiusLarge,
        marginBottom: 28,
        borderWidth: 2,
        borderColor: Colors.light.text,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
        elevation: 6,
    },
    previewBg: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.18,
    },
    previewOverlay: {
        padding: 24,
        paddingTop: 28,
    },
    previewEyebrow: {
        fontFamily: Fonts.heading,
        fontSize: 11,
        color: Colors.light.textMuted,
        letterSpacing: 1.4,
        marginBottom: 10,
    },
    previewTitle: {
        fontFamily: Fonts.heading,
        fontSize: 28,
        color: Colors.light.text,
        marginBottom: 10,
    },
    previewDescription: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.light.textMuted,
        lineHeight: 21,
        marginBottom: 18,
    },
    previewStatsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    previewStatChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: Colors.light.border,
        borderRadius: 999,
    },
    previewStatText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        color: Colors.light.text,
    },
    sectionHeader: {
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontFamily: Fonts.heading,
        fontSize: 12,
        color: Colors.light.textMuted,
        letterSpacing: 1.5,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: Layout.radiusLarge,
        marginBottom: 32,
        borderWidth: 2,
        borderColor: Colors.light.text,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 0,
        elevation: 3,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1.5,
        borderBottomColor: '#F0F0F0',
    },
    lastRow: {
        borderBottomWidth: 0,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
        paddingRight: 12,
    },
    rowTextWrap: {
        flex: 1,
    },
    iconBox: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.light.text,
    },
    rowLabel: {
        fontFamily: Fonts.heading,
        fontSize: 14,
        color: Colors.light.text,
        letterSpacing: 0.5,
        marginBottom: 3,
    },
    rowHint: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.light.textMuted,
        lineHeight: 18,
    },
    footer: {
        marginTop: 4,
        paddingHorizontal: 20,
    },
    footerText: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.light.textMuted,
        textAlign: 'center',
        lineHeight: 20,
    },
});