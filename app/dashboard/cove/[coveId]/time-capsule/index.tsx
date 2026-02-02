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
    Linking,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

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
    authorName?: string; // Optional if we fetch profile, for now simple
    createdAt: { seconds: number };
}

export default function TimeCapsuleScreen() {
    const { coveId } = useLocalSearchParams<{ coveId: string }>();
    const themeColors = Colors.light;
    const currentUser = auth.currentUser;

    // State
    const [capsule, setCapsule] = useState<TimeCapsule | null>(null);
    const [coveOwnerId, setCoveOwnerId] = useState<string | null>(null); // New state for Cove Owner
    const [entries, setEntries] = useState<CapsuleEntry[]>([]);
    const [loadingCapsule, setLoadingCapsule] = useState(true);
    const [loadingEntries, setLoadingEntries] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // Add Entry State
    const [newEntryText, setNewEntryText] = useState('');
    const [addingEntry, setAddingEntry] = useState(false);

    // Derived State
    const isOwner = coveOwnerId === currentUser?.uid;
    const now = new Date();

    // Schema Logic Fix
    const unlockDate = capsule ? new Date(capsule.unlockAt.seconds * 1000) : new Date();
    const isTimeUnlocked = now >= unlockDate;
    const isEmergencyOpen = capsule?.isEmergencyOpened || false;
    const isUnlocked = isTimeUnlocked || isEmergencyOpen;

    /* ---------------- 0. FETCH COVE (For Ownership) ---------------- */
    useEffect(() => {
        if (!coveId) return;
        const unsub = onSnapshot(doc(db, 'coves', coveId), (snap) => {
            if (snap.exists()) {
                setCoveOwnerId(snap.data().createdBy);
            }
        });
        return () => unsub();
    }, [coveId]);

    /* ---------------- 1. FETCH CAPSULE CONTAINER ---------------- */
    useEffect(() => {
        if (!coveId) return;

        // Listen for the SINGLE active capsule
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
        }, (err) => {
            console.error("Error fetching capsule:", err);
            setLoadingCapsule(false);
        });

        return () => unsub();
    }, [coveId]);

    /* ---------------- 2. FETCH ENTRIES (If Unlocked) ---------------- */
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
        }, (err) => {
            console.error("Error fetching entries:", err);
            // Permissions might fail if we think it's unlocked but rules differ
            setLoadingEntries(false);
        });

        return () => unsub();
    }, [coveId, capsule?.id, isUnlocked]);


    /* ---------------- HANDLERS ---------------- */
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
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to add memory.");
        } finally {
            setAddingEntry(false);
        }
    };

    const handleEmergencyToggle = async () => {
        if (!capsule || !isOwner) return;

        const newStatus = !capsule.isEmergencyOpened;
        const action = newStatus ? "OPEN" : "CLOSE";

        Alert.alert(
            `Emergency ${action}`,
            newStatus
                ? "Are you sure? Everyone will see the memories immediately."
                : "This will re-lock the capsule.",
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await updateDoc(doc(db, 'coves', coveId!, 'timeCapsules', capsule.id), {
                                isEmergencyOpened: newStatus
                            });
                        } catch (err) {
                            Alert.alert("Error", "Failed to toggle emergency mode.");
                        }
                    }
                }
            ]
        );
    };

    const handleNotifyMembers = async () => {
        // In a real app involving member emails, we'd fetch member emails from Firestore here.
        // For MVP, we'll just open a generic email draft.
        const subject = encodeURIComponent("Time Capsule Unlocked!");
        const body = encodeURIComponent(`The time capsule in our Cove is now open!\n\nOpen the app to see the memories.`);
        const url = `mailto:?subject=${subject}&body=${body}`;

        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert("Error", "No email app found.");
        }
    };

    /* ---------------- RENDER HELPERS ---------------- */

    // A. NO CAPSULE
    if (!loadingCapsule && !capsule) {
        return (
            <AuthGuard>
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
            </AuthGuard>
        );
    }

    // B. LOADING
    if (loadingCapsule) {
        return <View style={styles.centerAll}><ActivityIndicator /></View>;
    }

    // C. ACTIVE CAPSULE (Locked/Unlocked)
    return (
        <AuthGuard>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.container, { backgroundColor: themeColors.background }]}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Time Capsule</Text>
                    {/* Owner Action: Emergency Toggle */}
                    {isOwner && (
                        <TouchableOpacity onPress={handleEmergencyToggle}>
                            <Ionicons
                                name={isEmergencyOpen ? "lock-open" : "lock-closed"}
                                size={24}
                                color={isEmergencyOpen ? themeColors.error : themeColors.text}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                {/* STATUS BANNER */}
                <View style={[styles.statusBanner, isUnlocked ? styles.bgOpen : styles.bgLocked]}>
                    <Ionicons
                        name={isUnlocked ? "lock-open-outline" : "lock-closed-outline"}
                        size={32}
                        color={isUnlocked ? "#10B981" : "#6B7280"}
                    />
                    <View>
                        <Text style={styles.statusTitle}>
                            {isUnlocked ? "CAPSULE UNLOCKED" : "CAPSULE LOCKED"}
                        </Text>
                        <Text style={styles.statusSub}>
                            {isUnlocked
                                ? "Memories are now visible to all."
                                : `Unlocks on ${unlockDate.toLocaleDateString()}`}
                        </Text>
                    </View>

                    {isUnlocked && isOwner && (
                        <TouchableOpacity
                            style={styles.notifyBtn}
                            onPress={handleNotifyMembers}
                        >
                            <Ionicons name="mail-outline" size={20} color={themeColors.primary} />
                            <Text style={[styles.notifyText, { color: themeColors.primary }]}>Notify</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* CONTENT AREA */}
                {isUnlocked ? (
                    // UNLOCKED: List Entries
                    <FlatList
                        data={entries}
                        keyExtractor={i => i.id}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => (
                            <View style={styles.entryCard}>
                                <Text style={styles.entryText}>{item.text}</Text>
                                {/* We could show author name if we fetched profiles */}
                            </View>
                        )}
                        ListEmptyComponent={
                            <Text style={styles.emptyList}>The capsule was empty!</Text>
                        }
                    />
                ) : (
                    // LOCKED: Add Entry Form
                    <View style={styles.lockedContainer}>
                        <View style={styles.lockedPlaceholder}>
                            <Ionicons name="eye-off-outline" size={48} color="#e5e5e5" />
                            <Text style={styles.lockedHint}>
                                Contents are hidden.
                            </Text>
                        </View>

                        {/* Add Entry Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Add to the Capsule:</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Write a memory, a prediction, or a secret..."
                                multiline
                                value={newEntryText}
                                onChangeText={setNewEntryText}
                            />
                            <TouchableOpacity
                                style={[styles.btnPrimary, { marginTop: 16, backgroundColor: themeColors.primary }]}
                                onPress={handleAddEntry}
                                disabled={addingEntry}
                            >
                                {addingEntry ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.btnText}>Drop into Capsule</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </KeyboardAvoidingView>
        </AuthGuard>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerAll: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backAbsolute: { position: 'absolute', top: 60, left: 20 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        alignItems: 'center',
    },
    title: { fontFamily: Fonts.heading, fontSize: 20 },

    // Status Banner
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        marginHorizontal: 20,
        borderRadius: 16,
        gap: 16,
        marginBottom: 24,
    },
    bgLocked: { backgroundColor: '#F3F4F6' },
    bgOpen: { backgroundColor: '#ECFDF5' }, // Emerald-50
    statusTitle: { fontFamily: Fonts.heading, fontSize: 16, color: '#333' },
    statusSub: { fontFamily: Fonts.body, fontSize: 13, color: '#666' },

    // Unlocked List
    listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
    entryCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
    },
    entryText: { fontFamily: Fonts.body, fontSize: 16, color: '#333' },
    emptyList: { textAlign: 'center', color: '#999', marginTop: 40 },

    // Locked Container
    lockedContainer: { flex: 1, paddingHorizontal: 20 },
    lockedPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        opacity: 0.5
    },
    lockedHint: { marginTop: 8, color: '#999' },

    // Input
    inputContainer: {
        marginBottom: 40,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
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

    // Empty State
    emptyTitle: { fontFamily: Fonts.heading, fontSize: 18, marginTop: 16, color: '#333' },
    emptySub: { color: '#888', marginTop: 8 },
    notifyBtn: {
        marginLeft: 'auto',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        gap: 6,
    },
    notifyText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
    },
});
