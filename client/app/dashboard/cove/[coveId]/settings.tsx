import { logger } from '@/utils/logger';
import { EditCoveModal } from '@/components/Settings/EditCoveModal';
import { ManageMembersModal } from '@/components/Settings/ManageMembersModal';
import AppDialog, { type AppDialogAction } from '@/components/ui/AppDialog';
import { Colors, Fonts, Layout } from '@/constants/theme';
import { auth, db } from '@/firebaseConfig';
import { resolveMemberCount } from '@/utils/coveMembership';
import { deleteCoveWithJoinCode } from '@/utils/coveJoinCodes';
import { getCoveBackgroundUrl } from '@/utils/avatar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NAVBAR_HEIGHT } from '@/components/Navbar';
import {
    requestNotificationPermissions,
    saveFcmTokenToFirestore,
    getFcmToken,
} from '@/services/NotificationService';

interface CoveData {
    name: string;
    description?: string;
    avatarSeed?: string;
    memberCount?: number;
    members?: string[];
    createdBy: string;
    joinCode?: string;
}

interface UserPrefs {
    notificationsEnabled: boolean;
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

    // Notification preference state
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [notifLoading, setNotifLoading] = useState(false);

    const uid = auth?.currentUser?.uid;

    const showDialog = (title: string, message: string, actions?: AppDialogAction[]) => {
        setDialog({ title, message, actions });
    };

    // Subscribe to cove data
    useEffect(() => {
        if (!uid || !coveId) return;

        const coveRef = doc(db!, 'coves', coveId);
        const unsub = onSnapshot(
            coveRef,
            (snap) => {
                if (snap.exists()) {
                    const rawData = snap.data() as CoveData;
                    const data = {
                        ...rawData,
                        memberCount: resolveMemberCount(rawData.memberCount, rawData.members),
                    };
                    setCoveData(data);
                    setIsOwner(data.createdBy === uid);
                } else {
                    router.replace('/(tabs)/dashboard');
                }
                setLoading(false);
            },
            (err) => {
                if (err?.code === 'permission-denied' || err?.code === 'not-found') {
                    router.replace('/(tabs)/dashboard');
                    return;
                }
                logger.error('Error subscribing to cove:', err);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [coveId, uid]);

    // Subscribe to user notification prefs
    useEffect(() => {
        if (!uid || !db) return;

        const userRef = doc(db, 'users', uid);
        const unsub = onSnapshot(userRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data() as UserPrefs & Record<string, any>;
                // Default to true if the field doesn't exist yet
                setNotificationsEnabled(data.notificationsEnabled !== false);
            }
        });

        return () => unsub();
    }, [uid]);

    const handleToggleNotifications = async (value: boolean) => {
        if (!uid || !db) return;
        setNotifLoading(true);
        try {
            if (value) {
                // Turning ON: request permissions and register token
                const granted = await requestNotificationPermissions();
                if (!granted) {
                    showDialog(
                        'Notifications Blocked',
                        'Please enable notifications in your device Settings for Covelet to receive alerts.'
                    );
                    setNotifLoading(false);
                    return;
                }
                const token = await getFcmToken();
                if (token) {
                    await saveFcmTokenToFirestore(uid, token);
                }
            }

            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, { notificationsEnabled: value });
            setNotificationsEnabled(value);
        } catch (err: any) {
            logger.error('Failed to update notification preference:', err);
            showDialog('Error', 'Could not update notification setting. Please try again.');
        } finally {
            setNotifLoading(false);
        }
    };

    const coveBackgroundUrl = coveData?.avatarSeed ? getCoveBackgroundUrl(coveData.avatarSeed) : null;

    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteStep, setDeleteStep] = useState(0);

    const deletionSteps = [
        { label: 'Connecting', hint: 'Reaching sanctuary server...' },
        { label: 'Dissolving', hint: 'Wiping core records...' },
        { label: 'Finalizing', hint: 'Removing shared memories...' },
    ];

    const handleDelete = () => {
        showDialog('Dissolve Cove', 'This action is permanent. All shared memories and capsules will be lost forever.', [
            { label: 'Cancel', variant: 'secondary' },
            {
                label: 'Delete Forever',
                variant: 'danger',
                onPress: async () => {
                    try {
                        setIsDeleting(true);
                        setDeleteStep(0);
                        if (!coveId) return;

                        const timer = setInterval(() => {
                            setDeleteStep(prev => (prev < 2 ? prev + 1 : prev));
                        }, 800);

                        await deleteCoveWithJoinCode(coveId, coveData?.joinCode);

                        clearInterval(timer);
                        setDeleteStep(3);

                        setTimeout(() => {
                            router.replace('/(tabs)/dashboard');
                        }, 500);
                    } catch (err: any) {
                        logger.error('Error deleting cove:', err);
                        setIsDeleting(false);
                        showDialog('Error', 'Failed to delete Cove. Please check your internet connection and ensure the server is reachable.');
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

    if (isDeleting) {
        const currentStep = deletionSteps[Math.min(deleteStep, deletionSteps.length - 1)];
        const progressPercent = Math.min((deleteStep + 1) * (100 / deletionSteps.length), 100);

        return (
            <View style={[styles.container, styles.centered, { backgroundColor: Colors.light.background }]}>
                <View style={styles.deletionBox}>
                    <ActivityIndicator size="large" color={Colors.light.error} style={{ marginBottom: 24 }} />
                    <Text style={styles.deletionTitle}>{currentStep.label}...</Text>
                    <Text style={styles.deletionHint}>{currentStep.hint}</Text>

                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                    </View>

                    <Text style={styles.deletionSubtext}>
                        Closing the sanctuary and wiping records. Please stay on this screen.
                    </Text>
                </View>
            </View>
        );
    }

    if (!coveId || !coveData) return null;

    return (
        <View style={[styles.container, { backgroundColor: Colors.light.background }]}>
            {/* ── HEADER ── */}
            <View style={[styles.header, { paddingTop: insets.top + NAVBAR_HEIGHT + 40, paddingBottom: 16 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtnSquare}>
                    <Ionicons name="close" size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>COVE SETTINGS</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* ── PREVIEW CARD ── */}
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
                                <Text style={styles.previewStatText}>{resolveMemberCount(coveData.memberCount, coveData.members)} members</Text>
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

                {/* ── NOTIFICATIONS (available to all members) ── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
                </View>
                <View style={styles.section}>
                    <View style={[styles.row, styles.lastRow]}>
                        <View style={styles.rowLeft}>
                            <View style={[styles.iconBox, { backgroundColor: '#F0F4EF' }]}>
                                <Ionicons name="notifications-outline" size={20} color={Colors.light.primary} />
                            </View>
                            <View style={styles.rowTextWrap}>
                                <Text style={styles.rowLabel}>Push Notifications</Text>
                                <Text style={styles.rowHint}>
                                    {notificationsEnabled
                                        ? 'You will receive alerts for capsules and updates.'
                                        : 'You will not receive any push notifications.'}
                                </Text>
                            </View>
                        </View>
                        {notifLoading ? (
                            <ActivityIndicator size="small" color={Colors.light.primary} />
                        ) : (
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={handleToggleNotifications}
                                thumbColor={notificationsEnabled ? Colors.light.primary : '#ccc'}
                                trackColor={{ false: '#E8E2D9', true: Colors.light.primary + '60' }}
                            />
                        )}
                    </View>
                </View>

                {/* ── OWNER-ONLY: GENERAL ── */}
                {isOwner && (
                    <>
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

                        {/* ── OWNER-ONLY: DANGER ZONE ── */}
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
                    </>
                )}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        {isOwner
                            ? 'You are the owner of this sanctuary. Changes here affect everyone in the cove.'
                            : 'Notification settings are personal and only affect your device.'}
                    </Text>
                </View>
            </ScrollView>

            {isOwner && (
                <>
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
            )}

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
        paddingBottom: 16,
        backgroundColor: Colors.light.background,
        borderBottomWidth: 1.5,
        borderBottomColor: Colors.light.border,
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
    },
    previewCard: {
        minHeight: 200,
        borderRadius: Layout.radiusLarge,
        marginBottom: 28,
        marginTop: 8,
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
        fontSize: 26,
        color: Colors.light.text,
        marginBottom: 8,
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
        marginBottom: 10,
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
        marginBottom: 28,
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
        padding: 18,
        borderBottomWidth: 1.5,
        borderBottomColor: '#F0F0F0',
    },
    lastRow: {
        borderBottomWidth: 0,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
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
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    footerText: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.light.textMuted,
        textAlign: 'center',
        lineHeight: 20,
    },
    deletionBox: {
        padding: 32,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        width: '85%',
        borderRadius: Layout.radiusLarge,
        borderWidth: 2,
        borderColor: Colors.light.text,
        shadowColor: '#000',
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
        elevation: 4,
    },
    deletionTitle: {
        fontFamily: Fonts.heading,
        fontSize: 22,
        color: Colors.light.text,
        marginBottom: 8,
    },
    deletionHint: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.light.textMuted,
        marginBottom: 28,
        textAlign: 'center',
    },
    progressBarBg: {
        width: '100%',
        height: 12,
        backgroundColor: '#F0F0F0',
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: Colors.light.text,
        overflow: 'hidden',
        marginBottom: 24,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.light.error,
    },
    deletionSubtext: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.light.textMuted,
        textAlign: 'center',
        lineHeight: 18,
        opacity: 0.8,
    },
});
