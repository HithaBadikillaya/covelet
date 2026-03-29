import AppDialog from '@/components/ui/AppDialog';
import { Colors, Fonts, Layout } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface CreateQuoteModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (content: string) => Promise<void>;
}

const MAX_LENGTH = 500;

export const CreateQuoteModal: React.FC<CreateQuoteModalProps> = ({
    visible,
    onClose,
    onSubmit,
}) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);

    const trimmed = content.trim();
    const canSubmit = trimmed.length > 0 && trimmed.length <= MAX_LENGTH && !loading;

    const handleClose = () => {
        if (!loading) {
            setContent('');
            onClose();
        }
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        try {
            await onSubmit(trimmed);
            setContent('');
            onClose();
        } catch (err: any) {
            setDialog({ title: 'Error', message: err.message || 'Failed to post' });
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
                            <Text style={styles.title}>NEW NOTE</Text>
                            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} disabled={loading}>
                                <Ionicons name="close" size={24} color={Colors.light.text} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="What's on your mind? A joke, a memory, or just a simple hello..."
                            placeholderTextColor={Colors.light.textMuted}
                            multiline
                            value={content}
                            onChangeText={setContent}
                            maxLength={MAX_LENGTH}
                            textAlignVertical="top"
                            editable={!loading}
                        />

                        <View style={styles.footer}>
                            <Text style={styles.counter}>
                                {content.length} / {MAX_LENGTH}
                            </Text>
                            <TouchableOpacity
                                style={[
                                    styles.submit,
                                    { backgroundColor: canSubmit ? Colors.light.primary : Colors.light.muted },
                                ]}
                                onPress={handleSubmit}
                                disabled={!canSubmit}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text style={[styles.submitText, { color: canSubmit ? '#FFFFFF' : Colors.light.textMuted }]}>
                                        PIN TO WALL
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
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
        borderRadius: Layout.radiusLarge,
        padding: 32,
        width: '90%',
        maxWidth: 420,
        borderWidth: 2,
        borderColor: Colors.light.text,
        shadowColor: '#000',
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
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
        fontSize: 20,
        color: Colors.light.text,
        letterSpacing: 1,
    },
    closeBtn: { padding: 4 },
    input: {
        minHeight: 180,
        fontFamily: Fonts.body,
        fontSize: 16,
        color: Colors.light.text,
        textAlignVertical: 'top',
        marginBottom: 24,
        lineHeight: 24,
        padding: 16,
        backgroundColor: '#FDFBF7',
        borderWidth: 1.5,
        borderColor: Colors.light.border,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    counter: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.light.textMuted,
    },
    submit: {
        height: 48,
        paddingHorizontal: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.light.text,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
        elevation: 4,
    },
    submitText: {
        fontFamily: Fonts.heading,
        fontSize: 14,
        letterSpacing: 1,
    },
});