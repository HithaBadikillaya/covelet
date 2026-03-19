import AppDialog from '@/components/ui/AppDialog';
import { Colors, Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
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

interface AddPinModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: { title: string; description: string; x: number; y: number }) => Promise<void>;
}

export const AddPinModal: React.FC<AddPinModalProps> = ({
    visible,
    onClose,
    onSubmit,
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);

    const handleClose = () => {
        if (!loading) {
            setTitle('');
            setDescription('');
            onClose();
        }
    };

    const handleSubmit = async () => {
        const t = title.trim();
        const d = description.trim();
        if (!t) {
            setDialog({ title: 'Missing Title', message: 'Enter a title for this note.' });
            return;
        }
        setLoading(true);
        try {
            const randomX = Math.floor(Math.random() * 100) + 20;
            const randomY = Math.floor(Math.random() * 100) + 20;
            await onSubmit({ title: t, description: d, x: randomX, y: randomY });
            setTitle('');
            setDescription('');
            onClose();
        } catch (e: any) {
            setDialog({ title: 'Error', message: e.message || 'Failed to add note' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.overlay}
                >
                    <Pressable style={styles.backdrop} onPress={handleClose} />
                    <View style={[styles.card, { backgroundColor: '#FFFFFF' }]}>
                        <View style={styles.tape} />

                        <View style={styles.header}>
                            <Text style={styles.title}>Pin a Note</Text>
                            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} disabled={loading}>
                                <Ionicons name="close" size={24} color={Colors.light.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Title</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="A quick thought..."
                                placeholderTextColor={Colors.light.textMuted}
                                value={title}
                                onChangeText={setTitle}
                                editable={!loading}
                                maxLength={40}
                            />

                            <Text style={styles.label}>Details</Text>
                            <TextInput
                                style={[styles.input, styles.inputMultiline]}
                                placeholder="Expand on it..."
                                placeholderTextColor={Colors.light.textMuted}
                                multiline
                                value={description}
                                onChangeText={setDescription}
                                editable={!loading}
                            />

                            <TouchableOpacity
                                style={[styles.submit, { backgroundColor: Colors.light.primary }]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text style={styles.submitText}>Pin to Board</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
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
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(47, 46, 44, 0.4)' },
    card: {
        borderRadius: 4,
        padding: 32,
        width: '90%',
        maxWidth: 420,
        maxHeight: '85%',
        borderWidth: 1,
        borderColor: '#E8E2D9',
        backgroundColor: '#FFFFFF',
        shadowColor: '#2F2E2C',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 10,
    },
    tape: {
        position: 'absolute',
        top: -10,
        alignSelf: 'center',
        width: 80,
        height: 24,
        backgroundColor: Colors.light.secondary,
        opacity: 0.5,
        zIndex: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 24,
        color: Colors.light.text,
    },
    closeBtn: { padding: 4 },
    label: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        color: Colors.light.text,
        marginBottom: 8,
    },
    input: {
        fontFamily: Fonts.body,
        fontSize: 15,
        color: Colors.light.text,
        backgroundColor: '#FDFBF7',
        borderRadius: 4,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    inputMultiline: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    submit: {
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        borderWidth: 1.5,
        borderColor: Colors.light.text,
    },
    submitText: {
        fontFamily: Fonts.heading,
        fontSize: 16,
        color: '#FFFFFF',
    },
});
