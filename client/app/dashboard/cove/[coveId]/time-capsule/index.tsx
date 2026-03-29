import { logger } from '@/utils/logger';
import { CreateCapsuleModal } from '@/components/Cove/TimeCapsule/CreateCapsuleModal';
import AppDialog, { type AppDialogAction } from '@/components/ui/AppDialog';
import { Colors, Fonts } from '@/constants/theme';
import { auth, db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
    addDoc,
    collection,
    doc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
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
import { normalizeMultilineText, SECURITY_LIMITS } from '@/utils/security';

interface TimeCapsule {
    id: string;
    unlockAt?: { seconds: number } | null;
    ownerId: string;
    isEmergencyOpened: boolean;
    createdAt?: { seconds: number };
}

interface CapsuleEntry {
    id: string;
    text: string;
    authorId: string;
    authorName?: string;
    createdAt: { seconds: number };
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
    const [coveOwnerId, setCoveOwnerId] = useState<string | null>(null);
    const [entries, setEntries] = useState<CapsuleEntry[]>([]);
    const [loadingCapsule, setLoadingCapsule] = useState(true);
    const [loadingEntries, setLoadingEntries] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [newEntryText, setNewEntryText] = useState('');
    const [addingEntry, setAddingEntry] = useState(false);
    const [dialog, setDialog] = useState<DialogState>(null);

    const isOwner = coveOwnerId === currentUser?.uid;
    const unlockSeconds = capsule?.unlockAt?.seconds ?? 0;
    const unlockDate = unlockSeconds ? new Date(unlockSeconds * 1000) : new Date();
    const isTimeUnlocked = unlockSeconds > 0 && Date.now() >= unlockDate.getTime();
    const isEmergencyOpen = capsule?.isEmergencyOpened || false;
    const isUnlocked = isTimeUnlocked || isEmergencyOpen;

    useEffect(() => {
        if (!coveId || !db) return;

        const unsub = onSnapshot(doc(db, 'coves', coveId), (snap) => {
            if (snap.exists()) {
                setCoveOwnerId(snap.data().createdBy);
            }
        });

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
            (snap) => {
                const data = snap.docs.map((entryDoc) => ({
                    id: entryDoc.id,
                    ...entryDoc.data(),
                })) as CapsuleEntry[];
                setEntries(data);
                setLoadingEntries(false);
            },
            (err) => {
                logger.error('Error fetching entries:', err);
                setLoadingEntries(false);
            }
        );

        return () => unsub();
    }, [coveId, capsule, isUnlocked]);

    const showDialog = useCallback((title: string, message: string, actions?: AppDialogAction[]) => {
        setDialog({ title, message, actions });
    }, []);

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
            showDialog('Memory Added', 'Your secret is safe until the capsule opens.');
        } catch (error) {
            logger.error(error);
            showDialog('Error', 'Failed to add memory.');
        } finally {
            setAddingEntry(false);
        }
    };

    const confirmEmergencyToggle = () => {
        if (!capsule || !isOwner) {
            return;
        }

        const newStatus = !capsule.isEmergencyOpened;
        const action = newStatus ? 'OPEN' : 'CLOSE';

        showDialog(
            `Emergency ${action}`,
            newStatus
                ? 'Are you sure? Everyone in the Cove with notifications enabled will be alerted and the memories will unlock immediately.'
                : 'This will re-lock the capsule and stop showing the unlocked state in the app.',
            [
                { label: 'Cancel', variant: 'secondary' },
                {
                    label: 'Confirm',
                    variant: 'danger',
                    onPress: async () => {
                        try {
                            await updateDoc(doc(db!, 'coves', coveId!, 'timeCapsules', capsule.id), {
                                isEmergencyOpened: newStatus,
                            });
                        } catch (error) {
                            logger.error(error);
                            showDialog('Error', 'Failed to toggle emergency mode.');
                        }
                    },
                },
            ]
        );
    };

    if (!loadingCapsule && !capsule) {
        return (
            <View style={[styles.container, styles.centerAll]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backAbsolute}>
                    <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                </TouchableOpacity>

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

    if (loadingCapsule) {
        return (
            <View style={styles.centerAll}>
                <ActivityIndicator color={themeColors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: Colors.light.background }]}
        >
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}> 
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtnCircle}>
                    <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Time Capsule</Text>
                {isOwner ? (
                    <TouchableOpacity onPress={confirmEmergencyToggle} style={styles.lockBtnCircle}>
                        <Ionicons
                            name={isUnlocked ? 'lock-open' : 'lock-closed'}
                            size={20}
                            color={isUnlocked ? Colors.light.error : Colors.light.primary}
                        />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 44 }} />
                )}
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
                            renderItem={({ item, index }) => (
                                <View style={[styles.entryCard, { transform: [{ rotate: index % 2 === 0 ? '1deg' : '-1deg' }] }]}>
                                    <Text style={styles.entryText}>{item.text}</Text>
                                    <View style={styles.entryFooter}>
                                        <View style={styles.authorBadge}>
                                            <Text style={styles.authorText}>A Secret Member</Text>
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
    container: { flex: 1 },
    centerAll: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
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
    lockBtnCircle: {
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
        marginBottom: 20,
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.light.textMuted,
    },
    content: { flex: 1 },
    listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
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
    backAbsolute: {
        position: 'absolute',
        top: 60,
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
});