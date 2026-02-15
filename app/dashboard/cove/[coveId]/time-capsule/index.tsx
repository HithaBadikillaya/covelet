import { AuthGuard } from '@/components/auth/AuthGuard';
import { CreateCapsuleModal } from '@/components/Cove/TimeCapsule/CreateCapsuleModal';
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
    updateDoc
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TimeCapsule {
    id: string;
    unlockAt: { seconds: number };
    ownerId: string;
    isEmergencyOpened: boolean;
    createdAt?: { seconds: number };
}

interface CapsuleEntry {
    id: string;
    text: string;
    authorId: string;
    createdAt: { seconds: number };
}

export default function TimeCapsuleScreen() {
    const { coveId } = useLocalSearchParams<{ coveId: string }>();
    const themeColors = Colors.light;
    const currentUser = auth.currentUser;

    const [capsule, setCapsule] = useState<TimeCapsule | null>(null);
    const [coveOwnerId, setCoveOwnerId] = useState<string | null>(null);
    const [entries, setEntries] = useState<CapsuleEntry[]>([]);
    const [loadingCapsule, setLoadingCapsule] = useState(true);
    const [loadingEntries, setLoadingEntries] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [newEntryText, setNewEntryText] = useState('');
    const [addingEntry, setAddingEntry] = useState(false);

    const isOwner = coveOwnerId === currentUser?.uid;
    const now = new Date();
    const unlockDate = capsule ? new Date(capsule.unlockAt.seconds * 1000) : new Date();
    const isTimeUnlocked = now >= unlockDate;
    const isEmergencyOpen = capsule?.isEmergencyOpened || false;
    const isUnlocked = isTimeUnlocked || isEmergencyOpen;

    /* FETCH COVE OWNER */
    useEffect(() => {
        if (!coveId) return;
        const unsub = onSnapshot(doc(db, 'coves', coveId), (snap) => {
            if (snap.exists()) {
                setCoveOwnerId(snap.data().createdBy);
            }
        });
        return () => unsub();
    }, [coveId]);

    /* FETCH CAPSULE */
    useEffect(() => {
        if (!coveId) return;

        const q = query(
            collection(db, 'coves', coveId, 'timeCapsules'),
            orderBy('createdAt', 'desc'),
            limit(1)
        );

        const unsub = onSnapshot(q, (snap) => {
            if (!snap.empty) {
                const data = snap.docs[0].data();
                setCapsule({ id: snap.docs[0].id, ...data } as TimeCapsule);
            } else {
                setCapsule(null);
            }
            setLoadingCapsule(false);
        }, () => {
            setLoadingCapsule(false);
        });

        return () => unsub();
    }, [coveId]);

    /* FETCH ENTRIES */
    useEffect(() => {
        if (!coveId || !capsule || !isUnlocked) {
            setEntries([]);
            return;
        }

        setLoadingEntries(true);

        const q = query(
            collection(db, 'coves', coveId, 'timeCapsules', capsule.id, 'entries'),
            orderBy('createdAt', 'desc')
        );

        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as CapsuleEntry));
            setEntries(data);
            setLoadingEntries(false);
        }, () => setLoadingEntries(false));

        return () => unsub();
    }, [coveId, capsule?.id, isUnlocked]);

    const handleAddEntry = async () => {
        if (!newEntryText.trim() || !capsule || !currentUser) return;

        setAddingEntry(true);
        try {
            await addDoc(collection(db, 'coves', coveId!, 'timeCapsules', capsule.id, 'entries'), {
                text: newEntryText.trim(),
                authorId: currentUser.uid,
                createdAt: serverTimestamp(),
            });
            setNewEntryText('');
            Alert.alert("Memory Added", "Your secret is safe until the capsule opens.");
        } catch {
            Alert.alert("Error", "Failed to add memory.");
        } finally {
            setAddingEntry(false);
        }
    };

    const handleEmergencyToggle = async () => {
        if (!capsule || !isOwner) return;

        const newStatus = !capsule.isEmergencyOpened;

        Alert.alert(
            `Emergency ${newStatus ? "OPEN" : "CLOSE"}`,
            newStatus
                ? "Everyone will see the memories immediately."
                : "This will re-lock the capsule.",
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: 'destructive',
                    onPress: async () => {
                        await updateDoc(
                            doc(db, 'coves', coveId!, 'timeCapsules', capsule.id),
                            { isEmergencyOpened: newStatus }
                        );
                    }
                }
            ]
        );
    };

    return (
        <AuthGuard>
            <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    {loadingCapsule ? (
                        <View style={styles.centerAll}>
                            <ActivityIndicator />
                        </View>
                    ) : !capsule ? (
                        <View style={styles.centerAll}>
                            <Ionicons name="hourglass-outline" size={64} color="#ccc" />
                            <Text style={styles.emptyTitle}>No Time Capsule Found</Text>

                            {isOwner ? (
                                <TouchableOpacity
                                    style={[styles.btnPrimary, { backgroundColor: themeColors.primary, marginTop: 24 }]}
                                    onPress={() => setModalVisible(true)}
                                >
                                    <Text style={styles.btnText}>Create Time Capsule</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.emptySub}>
                                    Waiting for the Cove owner to create one.
                                </Text>
                            )}

                            <CreateCapsuleModal
                                visible={modalVisible}
                                onClose={() => setModalVisible(false)}
                                coveId={coveId!}
                            />
                        </View>
                    ) : (
                        <>
                            <View style={styles.header}>
                                <TouchableOpacity onPress={() => router.back()}>
                                    <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                                </TouchableOpacity>
                                <Text style={styles.title}>Time Capsule</Text>
                                {isOwner && (
                                    <TouchableOpacity onPress={handleEmergencyToggle}>
                                        <Ionicons
                                            name={isEmergencyOpen ? "lock-open" : "lock-closed"}
                                            size={24}
                                            color={themeColors.text}
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={[
                                styles.statusBanner,
                                isUnlocked ? styles.bgOpen : styles.bgLocked
                            ]}>
                                <Text style={styles.statusTitle}>
                                    {isUnlocked ? "CAPSULE UNLOCKED" : "CAPSULE LOCKED"}
                                </Text>
                                <Text style={styles.statusSub}>
                                    {isUnlocked
                                        ? "Memories are now visible."
                                        : `Unlocks on ${unlockDate.toLocaleDateString()}`
                                    }
                                </Text>
                            </View>

                            {isUnlocked ? (
                                <FlatList
                                    data={entries}
                                    keyExtractor={i => i.id}
                                    contentContainerStyle={styles.listContent}
                                    renderItem={({ item }) => (
                                        <View style={styles.entryCard}>
                                            <Text style={styles.entryText}>{item.text}</Text>
                                        </View>
                                    )}
                                />
                            ) : (
                                <View style={styles.lockedContainer}>
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>
                                            Add to the Capsule:
                                        </Text>
                                        <TextInput
                                            style={styles.textInput}
                                            multiline
                                            value={newEntryText}
                                            onChangeText={setNewEntryText}
                                        />
                                        <TouchableOpacity
                                            style={[
                                                styles.btnPrimary,
                                                { marginTop: 16, backgroundColor: themeColors.primary }
                                            ]}
                                            onPress={handleAddEntry}
                                            disabled={addingEntry}
                                        >
                                            {addingEntry
                                                ? <ActivityIndicator color="#fff" />
                                                : <Text style={styles.btnText}>Drop into Capsule</Text>
                                            }
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </>
                    )}
                </KeyboardAvoidingView>
            </SafeAreaView>
        </AuthGuard>
    );
}

const styles = StyleSheet.create({
    centerAll: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 20,
        alignItems: 'center',
    },

    title: { fontFamily: Fonts.heading, fontSize: 20 },

    statusBanner: {
        padding: 24,
        marginHorizontal: 20,
        borderRadius: 16,
        marginBottom: 24,
    },

    bgLocked: { backgroundColor: '#F3F4F6' },
    bgOpen: { backgroundColor: '#ECFDF5' },

    statusTitle: { fontFamily: Fonts.heading, fontSize: 16 },
    statusSub: { fontFamily: Fonts.body, fontSize: 13 },

    listContent: { paddingHorizontal: 20, paddingBottom: 40 },

    entryCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },

    entryText: { fontFamily: Fonts.body, fontSize: 16 },

    lockedContainer: { flex: 1, paddingHorizontal: 20 },

    inputContainer: {
        marginBottom: 40,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
    },

    inputLabel: { fontFamily: Fonts.bodyBold, marginBottom: 12 },

    textInput: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 16,
        minHeight: 100,
        textAlignVertical: 'top',
        fontSize: 16,
    },

    btnPrimary: {
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },

    btnText: { fontFamily: Fonts.heading, color: '#fff' },

    emptyTitle: { fontFamily: Fonts.heading, fontSize: 18, marginTop: 16 },
    emptySub: { marginTop: 8 },
});
