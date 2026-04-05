import { logger } from '@/utils/logger';
import AppDialog from '@/components/ui/AppDialog';
import { Colors, Fonts } from '@/constants/theme';
import { auth, db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import React, { useState } from 'react';
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
    const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);

    const val = Math.max(0, parseInt(amount) || 0);
    const multiplier = TIME_UNITS.find(u => u.value === unit)?.multiplier || 0;
    const unlockDate = new Date(Date.now() + (val * multiplier));

    const handleCreate = async () => {
        if (!auth?.currentUser) return;
        if (!val || val <= 0) {
            setDialog({ title: 'Set a Timer', message: 'The capsule needs a specific moment to open.' });
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db!, 'coves', coveId, 'timeCapsules'), {
                unlockAt: Timestamp.fromDate(unlockDate),
                ownerId: auth?.currentUser.uid,
                status: 'locked',
                createdAt: serverTimestamp(),
                durationLabel: `${val} ${unit}`,
                coveId,
            });

            onClose();
        } catch (error) {
            logger.error('Error creating capsule:', error);
            setDialog({ title: 'Creation Interrupted', message: 'We couldn\'t bury the capsule right now. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={onClose}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.overlay}
                >
                    <Pressable style={styles.backdrop} onPress={onClose} />

                    <View style={styles.card}>
                        <View style={styles.tape} />

                        <View style={styles.header}>
                            <View>
                                <Text style={styles.title}>Bury a Capsule</Text>
                                <Text style={styles.subtitle}>Choose how long it stays sealed.</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={Colors.light.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={styles.amountInputBox}>
                                <TextInput
                                    style={styles.amountInput}
                                    value={amount}
                                    onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#E8E2D9"
                                    maxLength={3}
                                    selectionColor={Colors.light.primary}
                                />
                            </View>

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
                            <Ionicons 
                                name={val > 0 ? "calendar-outline" : "alert-circle-outline"} 
                                size={18} 
                                color={val > 0 ? Colors.light.primary : Colors.light.textMuted} 
                            />
                            <Text style={styles.previewText}>
                                {val > 0 ? (
                                    <>Will open on <Text style={styles.bold}>{unlockDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</Text></>
                                ) : (
                                    <Text style={{ color: Colors.light.textMuted }}>Pick a future duration</Text>
                                )}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.buryButton, 
                                { backgroundColor: Colors.light.primary },
                                (!val || val <= 0) && { opacity: 0.5 }
                            ]}
                            onPress={handleCreate}
                            disabled={loading || !val || val <= 0}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.buryText}>Seal the Memories</Text>
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
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 32,
        paddingBottom: 48,
        gap: 24,
        borderWidth: 2.5,
        borderColor: Colors.light.text,
        shadowColor: '#000',
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
        backgroundColor: Colors.light.primary,
        opacity: 0.4,
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
        letterSpacing: 0.5,
    },
    subtitle: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.light.textMuted,
        marginTop: 2,
    },
    closeBtn: {
        padding: 4,
    },
    unitChip: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 0,
        backgroundColor: '#F9F7F2',
        borderWidth: 2,
        borderColor: Colors.light.border,
    },
    unitChipActive: {
        backgroundColor: Colors.light.primary,
        borderColor: Colors.light.text,
    },
    unitText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 13,
        color: Colors.light.textMuted,
        letterSpacing: 0.5,
    },
    unitTextActive: {
        color: '#FFFFFF',
    },
    unitScroll: {
        gap: 10,
        paddingHorizontal: 4,
    },
    inputContainer: {
        gap: 24,
    },
    amountInputBox: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    amountInput: {
        fontFamily: Fonts.heading,
        fontSize: 64,
        textAlign: 'center',
        color: Colors.light.text,
        minWidth: 120,
    },
    previewBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#F9F7F2',
        padding: 16,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: Colors.light.border,
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
        height: 60,
        borderRadius: 0,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2.5,
        borderColor: Colors.light.text,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 0,
        elevation: 4,
    },
    buryText: {
        fontFamily: Fonts.heading,
        fontSize: 18,
        color: '#FFFFFF',
        letterSpacing: 1,
    },
});