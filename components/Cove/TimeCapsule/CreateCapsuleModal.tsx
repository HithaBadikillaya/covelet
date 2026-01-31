import { Colors, Fonts } from '@/constants/theme';
import { auth, db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface CreateCapsuleModalProps {
    visible: boolean;
    onClose: () => void;
    coveId: string;
}

type TimeUnit = 'minutes' | 'hours' | 'days' | 'months' | 'years';

const TIME_UNITS: { label: string; value: TimeUnit; multiplier: number }[] = [
    { label: 'Minutes', value: 'minutes', multiplier: 60 * 1000 },
    { label: 'Hours', value: 'hours', multiplier: 60 * 60 * 1000 },
    { label: 'Days', value: 'days', multiplier: 24 * 60 * 60 * 1000 },
    { label: 'Months', value: 'months', multiplier: 30 * 24 * 60 * 60 * 1000 },
    { label: 'Years', value: 'years', multiplier: 365 * 24 * 60 * 60 * 1000 },
];

export const CreateCapsuleModal: React.FC<CreateCapsuleModalProps> = ({ visible, onClose, coveId }) => {
    const themeColors = Colors.light;
    const [amount, setAmount] = useState('1');
    const [unit, setUnit] = useState<TimeUnit>('days');
    const [loading, setLoading] = useState(false);
    const [unlockDate, setUnlockDate] = useState<Date>(new Date());

    // Update preview date
    useEffect(() => {
        const val = parseInt(amount) || 0;
        const multiplier = TIME_UNITS.find(u => u.value === unit)?.multiplier || 0;
        const futureTime = Date.now() + (val * multiplier);
        setUnlockDate(new Date(futureTime));
    }, [amount, unit]);

    const handleCreate = async () => {
        if (!auth.currentUser) return;
        const val = parseInt(amount);
        if (!val || val <= 0) {
            Alert.alert("Invalid Duration", "Please enter a valid number.");
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'coves', coveId, 'timeCapsules'), {
                // MATCHING FIRESTORE RULES:
                unlockAt: Timestamp.fromDate(unlockDate),       // changed from unlockDate
                ownerId: auth.currentUser.uid,                  // changed from createdBy
                isEmergencyOpened: false,                       // changed from isEmergencyOpen
                createdAt: serverTimestamp(),
                durationLabel: `${val} ${unit}`
            });

            onClose();
        } catch (error) {
            console.error("Error creating capsule:", error);
            Alert.alert("Error", "Could not create time capsule.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <Pressable style={styles.backdrop} onPress={onClose} />

                <View style={[styles.card, { backgroundColor: themeColors.background }]}>
                    <View style={styles.header}>
                        <View>
                            <Text style={[styles.title, { color: themeColors.text }]}>Initialize Capsule</Text>
                            <Text style={styles.subtitle}>When should it open?</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={themeColors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputSection}>
                        <TextInput
                            style={[styles.amountInput, { color: themeColors.text }]}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#ccc"
                            selectionColor={themeColors.primary}
                        />

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.unitScroll}
                        >
                            {TIME_UNITS.map((u) => (
                                <TouchableOpacity
                                    key={u.value}
                                    style={[
                                        styles.unitChip,
                                        unit === u.value && { backgroundColor: themeColors.primary }
                                    ]}
                                    onPress={() => setUnit(u.value)}
                                >
                                    <Text style={[
                                        styles.unitText,
                                        unit === u.value ? { color: '#fff' } : { color: themeColors.textMuted }
                                    ]}>
                                        {u.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.previewBox}>
                        <Ionicons name="calendar-outline" size={20} color={themeColors.primary} />
                        <Text style={styles.previewText}>
                            Unlocks on <Text style={styles.bold}>{unlockDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</Text>
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.buryButton, { backgroundColor: themeColors.primary }]}
                        onPress={handleCreate}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buryText}>Set Lock Timer</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    card: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
        gap: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 24,
    },
    subtitle: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },
    closeBtn: {
        padding: 4,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
    },
    inputSection: {
        gap: 16,
    },
    amountInput: {
        fontFamily: Fonts.heading,
        fontSize: 48,
        textAlign: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#f0f0f0',
        paddingVertical: 8,
    },
    unitScroll: {
        gap: 8,
        paddingHorizontal: 4,
    },
    unitChip: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 24,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    unitText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
    },
    previewBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        padding: 16,
        borderRadius: 16,
    },
    previewText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: '#555',
    },
    bold: {
        fontFamily: Fonts.bodyBold,
        color: '#8B5CF6',
    },
    buryButton: {
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buryText: {
        fontFamily: Fonts.heading,
        fontSize: 18,
        color: '#fff',
        letterSpacing: 1,
    },
});
