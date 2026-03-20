import AppDialog from '@/components/ui/AppDialog';
import { Colors, Fonts } from '@/constants/theme';
import { auth, db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
    const [amount, setAmount] = useState('1');
    const [unit, setUnit] = useState<TimeUnit>('days');
    const [loading, setLoading] = useState(false);
    const [unlockDate, setUnlockDate] = useState<Date>(new Date());
    const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);

    useEffect(() => {
        const val = parseInt(amount) || 0;
        const multiplier = TIME_UNITS.find(u => u.value === unit)?.multiplier || 0;
        const futureTime = Date.now() + (val * multiplier);
        setUnlockDate(new Date(futureTime));
    }, [amount, unit]);

    const handleCreate = async () => {
        if (!auth?.currentUser) return;
        const val = parseInt(amount);
        if (!val || val <= 0) {
            setDialog({ title: 'Invalid Duration', message: 'Please enter a valid number.' });
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db!, 'coves', coveId, 'timeCapsules'), {
                unlockAt: Timestamp.fromDate(unlockDate),
                ownerId: auth?.currentUser.uid,
                isEmergencyOpened: false,
                createdAt: serverTimestamp(),
                durationLabel: `${val} ${unit}`,
            });

            onClose();
        } catch (error) {
            console.error('Error creating capsule:', error);
            setDialog({ title: 'Error', message: 'Could not create time capsule.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
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

                    <View style={[styles.card, { backgroundColor: '#FFFFFF' }]}>
                        <View style={styles.tape} />

                        <View style={styles.header}>
                            <View>
                                <Text style={styles.title}>Bury a Capsule</Text>
                                <Text style={styles.subtitle}>How long should it stay hidden?</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={Colors.light.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputSection}>
                            <TextInput
                                style={styles.amountInput}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor="#E8E2D9"
                                selectionColor={Colors.light.primary}
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
                                            unit === u.value && styles.unitChipActive,
                                        ]}
                                        onPress={() => setUnit(u.value)}
                                    >
                                        <Text style={[
                                            styles.unitText,
                                            unit === u.value && styles.unitTextActive,
                                        ]}>
                                            {u.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.previewBox}>
                            <Ionicons name="calendar-outline" size={20} color={Colors.light.primary} />
                            <Text style={styles.previewText}>
                                Will open on <Text style={styles.bold}>{unlockDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</Text>
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.buryButton, { backgroundColor: Colors.light.primary }]}
                            onPress={handleCreate}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.buryText}>Seal the Capsule</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <AppDialog
                visible={!!dialog}
                title={dialog?.title || ''}
                message={dialog?.message || ''}
                onClose={() => setDialog(null)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(47, 46, 44, 0.4)',
    },
    card: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 32,
        paddingBottom: 48,
        gap: 24,
        borderWidth: 1,
        borderColor: '#E8E2D9',
        shadowColor: '#2F2E2C',
        shadowOffset: { width: 0, height: -12 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 10,
    },
    tape: {
        position: 'absolute',
        top: -10,
        alignSelf: 'center',
        width: 80,
        height: 24,
        backgroundColor: '#4A6741',
        opacity: 0.3,
        zIndex: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 24,
        color: Colors.light.text,
    },
    subtitle: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.light.textMuted,
        marginTop: 4,
    },
    closeBtn: {
        padding: 4,
    },
    inputSection: {
        gap: 20,
    },
    amountInput: {
        fontFamily: Fonts.heading,
        fontSize: 64,
        textAlign: 'center',
        color: Colors.light.text,
        borderBottomWidth: 1,
        borderBottomColor: '#F1EFE9',
        paddingVertical: 8,
    },
    unitScroll: {
        gap: 10,
        paddingHorizontal: 4,
    },
    unitChip: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    unitChipActive: {
        backgroundColor: Colors.light.primary,
        borderColor: Colors.light.primary,
    },
    unitText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        color: Colors.light.textMuted,
    },
    unitTextActive: {
        color: '#FFFFFF',
    },
    previewBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#F9F7F2',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    previewText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.light.text,
    },
    bold: {
        fontFamily: Fonts.bodyBold,
        color: Colors.light.primary,
    },
    buryButton: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buryText: {
        fontFamily: Fonts.heading,
        fontSize: 18,
        color: '#FFFFFF',
    },
});