import { logger } from '@/utils/logger';
import { CreateCapsuleModal } from '@/components/Cove/TimeCapsule/CreateCapsuleModal';
import AppDialog, { type AppDialogAction } from '@/components/ui/AppDialog';
import { Colors, Fonts } from '@/constants/theme';
import { auth, db } from '@/firebaseConfig';
import { apiGet } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
} from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NAVBAR_HEIGHT } from '@/components/Navbar';
import { normalizeMultilineText, SECURITY_LIMITS } from '@/utils/security';
import {
    prepareTimeCapsuleNotifications,
    syncTimeCapsuleNotification,
} from '@/utils/timeCapsuleNotifications';

interface TimeCapsule {
    id: string;
    unlockAt?: { seconds: number } | null;
    ownerId: string;
    createdAt?: { seconds: number };
}

interface CapsuleEntry {
    id: string;
    text: string;
    authorId: string;
    authorName?: string;
    createdAt: { seconds: number };
}

interface CapsuleStatsResponse {
    capsuleId: string;
    entryCount: number;
}


type DialogState = {
    title: string;
    message: string;
    actions?: AppDialogAction[];
} | null;

export default function TimeCapsuleScreen() {
    const { coveId } = useLocalSearchParams<{ coveId: string }>();
    const themeColors = Colors.light;
    const currentUser = auth?.currentUser;
    const insets = useSafeAreaInsets();

    const [capsule, setCapsule] = useState<TimeCapsule | null>(null);
    const [coveName, setCoveName] = useState<string>('');
    const [coveOwnerId, setCoveOwnerId] = useState<string | null>(null);
    const [entries, setEntries] = useState<CapsuleEntry[]>([]);
    const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
    const [entryCount, setEntryCount] = useState(0);
    const [loadingCapsule, setLoadingCapsule] = useState(true);
    const [loadingEntries, setLoadingEntries] = useState(false);
    const [loadingEntryCount, setLoadingEntryCount] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [newEntryText, setNewEntryText] = useState('');
    const [addingEntry, setAddingEntry] = useState(false);
    const [dialog, setDialog] = useState<DialogState>(null);

    const isOwner = coveOwnerId === currentUser?.uid;
    const unlockSeconds = capsule?.unlockAt?.seconds ?? 0;
    const unlockDate = unlockSeconds ? new Date(unlockSeconds * 1000) : new Date();
    const isUnlocked = unlockSeconds > 0 && Date.now() >= unlockDate.getTime();

    useEffect(() => {
        if (!coveId || !db) return;

        const unsub = onSnapshot(
            doc(db, 'coves', coveId),
            (snap) => {
                if (!snap.exists()) {
                    router.replace('/(tabs)/dashboard');
                    return;
                }

                const data = snap.data();
                setCoveOwnerId(data.createdBy);
                setCoveName(typeof data.name === 'string' ? data.name : '');
            },
            (error) => {
                if (error?.code === 'permission-denied' || error?.code === 'not-found') {
                    router.replace('/(tabs)/dashboard');
                    return;
                }

                logger.error('TimeCapsuleScreen: Failed to subscribe to cove.', error);
            }
        );

        return () => unsub();
    }, [coveId]);

    useEffect(() => {
        if (!coveId || !db) return;
 
        const capsuleQuery = query(
            collection(db, 'coves', coveId, 'timeCapsules'),
            orderBy('createdAt', 'desc'),
            limit(1)
        );

        const unsub = onSnapshot(
            capsuleQuery,
            (snap) => {
                if (!snap.empty) {
                    const data = snap.docs[0].data();
                    setCapsule({ id: snap.docs[0].id, ...data } as TimeCapsule);
                } else {
                    setCapsule(null);
                }
                setLoadingCapsule(false);
            },
            (err) => {
                if (err?.code === 'permission-denied' || err?.code === 'not-found') {
                    router.replace('/(tabs)/dashboard');
                    return;
                }

                logger.error('Error fetching capsule:', err);
                setLoadingCapsule(false);
            }
        );

        return () => unsub();
    }, [coveId]);

    useEffect(() => {
        if (!coveId || !capsule || !isUnlocked || !db) {
            setEntries([]);
            return;
        }
 
        setLoadingEntries(true);
        const entriesQuery = query(
            collection(db, 'coves', coveId, 'timeCapsules', capsule.id, 'entries'),
            orderBy('createdAt', 'desc')
        );

        const unsub = onSnapshot(
            entriesQuery,
            async (snap) => {
                const data = snap.docs.map((entryDoc) => ({
                    id: entryDoc.id,
                    ...entryDoc.data(),
                })) as CapsuleEntry[];
                setEntries(data);
                setEntryCount(data.length);
                setLoadingEntries(false);

                if (db) {
                    const unknownAuthorIds = data
                        .map((e) => e.authorId)
                        .filter((id) => id && !authorNames[id]);
                    const uniqueUnknown = Array.from(new Set(unknownAuthorIds));
                    if (uniqueUnknown.length > 0) {
                        const nameMap: Record<string, string> = {};
                        await Promise.all(
                            uniqueUnknown.map(async (authorId) => {
                                try {
                                    const userSnap = await getDoc(doc(db!, 'users', authorId));
                                    if (userSnap.exists()) {
                                        const userData = userSnap.data();
                                        nameMap[authorId] = typeof userData.name === 'string' && userData.name
                                            ? userData.name
                                            : 'A Member';
                                    } else {
                                        nameMap[authorId] = 'A Member';
                                    }
                                } catch {
                                    nameMap[authorId] = 'A Member';
                                }
                            })
                        );
                        setAuthorNames((prev) => ({ ...prev, ...nameMap }));
                    }
                }
            },
            (err) => {
                if (err?.code === 'permission-denied' || err?.code === 'not-found') {
                    router.replace('/(tabs)/dashboard');
                    return;
                }

                logger.error('Error fetching entries:', err);
                setLoadingEntries(false);
            }
        );

        return () => unsub();
    }, [coveId, capsule, isUnlocked]);

    useEffect(() => {
        if (!coveId || !capsule?.id) {
            setEntryCount(0);
            setLoadingEntryCount(false);
            return;
        }

        let cancelled = false;
        setLoadingEntryCount(true);

        void apiGet<CapsuleStatsResponse>(
            `/coves/${coveId}/time-capsules/${capsule.id}/stats`,
        ).then((response) => {
            if (cancelled) {
                return;
            }

            if (response.data) {
                setEntryCount(response.data.entryCount);
            } else if (response.error) {
                logger.warn('Unable to load time capsule entry count.', response.error);
            }

            setLoadingEntryCount(false);
        });

        return () => {
            cancelled = true;
        };
    }, [coveId, capsule?.id]);

    const showDialog = useCallback((title: string, message: string, actions?: AppDialogAction[]) => {
        setDialog({ title, message, actions });
    }, []);

    useEffect(() => {
        if (!currentUser || !capsule || !coveId || !coveName) return;

        const setupNotifications = async () => {
            try {
                await prepareTimeCapsuleNotifications(currentUser.uid);
                await syncTimeCapsuleNotification({
                    userId: currentUser.uid,
                    coveId,
                    coveName,
                    capsuleId: capsule.id,
                    unlockAtSeconds: capsule.unlockAt?.seconds ?? 0,
                });
            } catch (err) {
                logger.warn('TimeCapsuleScreen: Unable to sync notification.', err);
            }
        };

        void setupNotifications();
    }, [currentUser?.uid, capsule?.id, coveId, coveName]);

    const handleAddEntry = async () => {
        const safeEntryText = normalizeMultilineText(newEntryText, SECURITY_LIMITS.timeCapsuleEntry);
        if (!safeEntryText || !capsule || !currentUser) {
            return;
        }

        setAddingEntry(true);
        try {
            const now = new Date();
            await addDoc(collection(db!, 'coves', coveId!, 'timeCapsules', capsule.id, 'entries'), {
                text: safeEntryText,
                authorId: currentUser.uid,
                createdAt: serverTimestamp(),
                coveId,
                capsuleId: capsule.id,
                day: now.getDate(),
                month: now.getMonth(),
            });
            setNewEntryText('');
            setEntryCount((currentCount) => currentCount + 1);
            showDialog('Memory Added', 'Your secret is safe until the capsule opens.');
        } catch (error) {
            logger.error(error);
            showDialog('Error', 'Failed to add memory.');
        } finally {
            setAddingEntry(false);
        }
    };

    if (loadingCapsule) {
        return (
            <View style={[styles.container, styles.centerAll]}>
                <ActivityIndicator color={themeColors.primary} />
            </View>
        );
    }

    if (!capsule) {
        return (
            <View style={[styles.container, styles.centerAll]}>
                <View style={{ width: 44 }} /> 
                <Ionicons name="hourglass-outline" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>No Time Capsule Found</Text>

                {isOwner ? (
                    <TouchableOpacity
                        style={[styles.btnPrimary, { backgroundColor: themeColors.primary, marginTop: 24, paddingHorizontal: 32 }]}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={styles.btnText}>Create Time Capsule</Text>
                    </TouchableOpacity>
                ) : (
                    <Text style={styles.emptySub}>Waiting for the Cove owner to create one.</Text>
                )}

                <CreateCapsuleModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    coveId={coveId!}
                />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={[styles.header, { paddingTop: insets.top + NAVBAR_HEIGHT + 35, paddingBottom: 16 }]}>
                <View style={{ width: 44 }} />
                <Text style={styles.title}>Time Capsule</Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={[styles.statusLabel, isUnlocked ? styles.bgOpen : styles.bgLocked]}>
                <View style={styles.statusLabelContent}>
                    <Ionicons
                        name={isUnlocked ? 'lock-open' : 'lock-closed'}
                        size={20}
                        color={isUnlocked ? '#4A6741' : '#D4A373'}
                    />
                    <Text style={[styles.statusTitle, { color: isUnlocked ? '#4A6741' : '#D4A373' }]}>
                        {isUnlocked ? 'MEMORIES UNLOCKED' : 'CAPSULE SEALED'}
                    </Text>
                </View>
                {!isUnlocked ? (
                    <Text style={styles.statusSub}>Unlocks {unlockDate.toLocaleDateString()}</Text>
                ) : null}
            </View>

            {!isUnlocked ? (
                <Text style={styles.notificationNote}>
                    Everyone in this Cove who has notifications enabled will be alerted automatically when the capsule opens.
                </Text>
            ) : null}

            <View style={styles.countCard}>
                <Ionicons
                    name={isUnlocked ? 'chatbubble-ellipses-outline' : 'mail-outline'}
                    size={18}
                    color={Colors.light.primary}
                />
                <Text style={styles.countCardText}>
                    {loadingEntryCount && entryCount === 0
                        ? 'Checking how many memories are inside...'
                        : `${entryCount} ${entryCount === 1 ? 'message' : 'messages'} ${isUnlocked ? 'revealed' : 'tucked inside already'}`}
                </Text>
            </View>

            <View style={styles.content}>
                {isUnlocked ? (
                    loadingEntries && entries.length === 0 ? (
                        <View style={styles.centerAll}>
                            <ActivityIndicator color={themeColors.primary} />
                        </View>
                    ) : (
                        <FlatList
                            data={entries}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <View style={styles.entryCard}>
                                    <Text style={styles.entryText}>{item.text}</Text>
                                    <View style={styles.entryFooter}>
                                        <View style={styles.authorBadge}>
                                            <Text style={styles.authorText}>
                                                {authorNames[item.authorId] || item.authorName || 'A Member'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="leaf-outline" size={48} color={Colors.light.border} />
                                    <Text style={styles.emptyList}>The capsule was empty!</Text>
                                </View>
                            }
                        />
                    )
                ) : (
                    <View style={styles.lockedContainer}>
                        <View style={styles.envelopeIconContainer}>
                            <View style={styles.envelopeIcon}>
                                <Ionicons name="mail" size={100} color="#F9F7F2" />
                                <View style={styles.waxSeal}>
                                    <Ionicons name="heart" size={24} color="#FFFFFF" opacity={0.6} />
                                </View>
                            </View>
                            <Text style={styles.lockedHint}>Your shared secrets are safe inside.</Text>
                        </View>

                        <View style={styles.pocketContainer}>
                            <Text style={styles.pocketTitle}>Drop a memory into the capsule</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Write something for the future..."
                                placeholderTextColor={Colors.light.textMuted}
                                multiline
                                value={newEntryText}
                                onChangeText={setNewEntryText}
                            />
                            <TouchableOpacity
                                style={[styles.dropBtn, { backgroundColor: Colors.light.primary }]}
                                onPress={handleAddEntry}
                                disabled={addingEntry || !newEntryText.trim()}
                            >
                                {addingEntry ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text style={styles.dropBtnText}>Pin it Inside</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            <AppDialog
                visible={!!dialog}
                title={dialog?.title || ''}
                message={dialog?.message || ''}
                actions={dialog?.actions}
                onClose={() => setDialog(null)}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    centerAll: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: Colors.light.background,
    },
    backBtnCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 24,
        color: Colors.light.text,
    },
    statusLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 12,
    },
    bgLocked: {
        backgroundColor: '#FEFCE8',
        borderColor: '#FEF08A',
    },
    bgOpen: {
        backgroundColor: '#F0FDF4',
        borderColor: '#DCFCE7',
    },
    statusLabelContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 13,
        letterSpacing: 0.5,
    },
    statusSub: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: '#D4A373',
    },
    notificationNote: {
        marginHorizontal: 20,
        marginBottom: 12,
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.light.textMuted,
    },
    countCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginHorizontal: 20,
        marginBottom: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 12,
    },
    countCardText: {
        flex: 1,
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: Colors.light.text,
        lineHeight: 20,
    },
    content: { flex: 1 },
    listContent: { paddingHorizontal: 20, paddingBottom: 100, gap: 16 },
    entryCard: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#F1EFE9',
        shadowColor: '#2F2E2C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    entryText: {
        fontFamily: Fonts.body,
        fontSize: 16,
        color: Colors.light.text,
        lineHeight: 24,
    },
    entryFooter: {
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F9F7F2',
    },
    authorBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F9F7F2',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    authorText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 11,
        color: Colors.light.textMuted,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
        opacity: 0.5,
    },
    emptyList: {
        fontFamily: Fonts.body,
        color: Colors.light.textMuted,
        marginTop: 12,
    },
    lockedContainer: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
    },
    envelopeIconContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.8,
    },
    envelopeIcon: {
        width: 140,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FDFBF7',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E8E2D9',
        marginBottom: 20,
        position: 'relative',
    },
    waxSeal: {
        position: 'absolute',
        bottom: -15,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#A0522D',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#8B4513',
    },
    lockedHint: {
        fontFamily: Fonts.body,
        color: Colors.light.textMuted,
        fontSize: 15,
    },
    pocketContainer: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: '#E8E2D9',
        borderBottomWidth: 0,
        shadowColor: '#2F2E2C',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    pocketTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        color: Colors.light.text,
        marginBottom: 16,
    },
    textInput: {
        backgroundColor: '#F9F7F2',
        borderRadius: 12,
        padding: 16,
        minHeight: 100,
        textAlignVertical: 'top',
        fontSize: 15,
        fontFamily: Fonts.body,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    dropBtn: {
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropBtnText: {
        fontFamily: Fonts.heading,
        color: '#FFFFFF',
        fontSize: 16,
    },
    emptyTitle: {
        fontFamily: Fonts.heading,
        fontSize: 22,
        color: Colors.light.text,
        marginBottom: 12,
    },
    emptySub: {
        fontFamily: Fonts.body,
        color: Colors.light.textMuted,
        textAlign: 'center',
    },
    btnPrimary: {
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    btnText: {
        fontFamily: Fonts.heading,
        color: '#FFFFFF',
        fontSize: 16,
    },
});
