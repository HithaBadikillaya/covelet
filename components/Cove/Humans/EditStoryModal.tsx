import { Colors, Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

interface EditStoryModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (content: string) => Promise<void>;
    initialContent: string;
}

const MAX_WORDS = 500;
const MAX_LENGTH = MAX_WORDS * 10;

export const EditStoryModal: React.FC<EditStoryModalProps> = ({
    visible,
    onClose,
    onSubmit,
    initialContent,
}) => {
    const themeColors = Colors.light;
    const [content, setContent] = useState(initialContent);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            setContent(initialContent);
        }
    }, [visible, initialContent]);

    const trimmed = content.trim();
    const wordCount = trimmed.length > 0
        ? trimmed.split(/\s+/).filter((w) => w.length > 0).length
        : 0;
    const isOverLimit = wordCount > MAX_WORDS;
    const isEmpty = trimmed.length === 0;
    const isUnchanged = trimmed === initialContent.trim();
    const canSave = !isEmpty && !isOverLimit && !loading && !isUnchanged;

    const handleClose = () => {
        if (!loading) {
            setContent(initialContent);
            onClose();
        }
    };

    const handleSubmit = async () => {
        if (!canSave) return;

        setLoading(true);
        try {
            await onSubmit(trimmed);
            onClose();
        } catch (error: any) {
            setLoading(false);
            const code = error?.code;
            const msg = error?.message || 'Failed to update story';
            if (code === 'permission-denied' || code === 'not-found') {
                Alert.alert(
                    'Cannot Update',
                    'This story may have been deleted or you no longer have permission to edit it.',
                    [{ text: 'OK', onPress: onClose }]
                );
                onClose();
                return;
            }
            if (code === 'unavailable' || msg.toLowerCase().includes('network')) {
                Alert.alert('Network Error', 'Please check your connection and try again.');
                return;
            }
            Alert.alert('Error', msg);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <Pressable style={styles.backdrop} onPress={handleClose} />

                <View style={[styles.card, { backgroundColor: themeColors.card }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: themeColors.text }]}>
                            Edit Your Story
                        </Text>
                        <TouchableOpacity
                            onPress={handleClose}
                            style={styles.closeBtn}
                            disabled={loading}
                        >
                            <Ionicons name="close" size={24} color={themeColors.text} />
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={[
                            styles.textInput,
                            {
                                color: themeColors.text,
                                backgroundColor: themeColors.muted,
                                borderColor: isOverLimit ? themeColors.error : themeColors.border,
                            },
                        ]}
                        placeholder="Your story..."
                        placeholderTextColor={themeColors.textMuted}
                        multiline
                        value={content}
                        onChangeText={setContent}
                        maxLength={MAX_LENGTH}
                        textAlignVertical="top"
                        editable={!loading}
                    />

                    <View style={styles.counterRow}>
                        <Text
                            style={[
                                styles.counter,
                                { color: isOverLimit ? themeColors.error : themeColors.textMuted },
                            ]}
                        >
                            {wordCount} / {MAX_WORDS} words
                        </Text>
                        {isOverLimit && (
                            <Text style={[styles.errorText, { color: themeColors.error }]}>
                                Reduce length to save
                            </Text>
                        )}
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.cancelButton, { borderColor: themeColors.border }]}
                            onPress={handleClose}
                            disabled={loading}
                        >
                            <Text style={[styles.cancelText, { color: themeColors.text }]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                {
                                    backgroundColor: canSave ? themeColors.primary : themeColors.muted,
                                    opacity: loading ? 0.6 : 1,
                                },
                            ]}
                            onPress={handleSubmit}
                            disabled={!canSave}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.saveText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    card: {
        borderRadius: 24,
        padding: 24,
        width: '90%',
        maxWidth: 420,
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 22,
    },
    closeBtn: {
        padding: 8,
        borderRadius: 20,
    },
    textInput: {
        minHeight: 160,
        borderRadius: 12,
        padding: 16,
        fontFamily: Fonts.body,
        fontSize: 16,
        lineHeight: 24,
        borderWidth: 1,
        marginBottom: 12,
    },
    counterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    counter: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 12,
    },
    errorText: {
        fontFamily: Fonts.body,
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
    },
    saveButton: {
        flex: 1,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveText: {
        fontFamily: Fonts.heading,
        fontSize: 16,
        color: '#fff',
    },
});
