import { Colors, Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
    const themeColors = Colors.light;
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

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
            Alert.alert('Error', err.message || 'Failed to post');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <Pressable style={styles.backdrop} onPress={handleClose} />
                <View style={[styles.card, { backgroundColor: themeColors.card }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: themeColors.text }]}>Add to the Wall</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeBtn} disabled={loading}>
                            <Ionicons name="close" size={24} color={themeColors.text} />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={[styles.input, { color: themeColors.text, backgroundColor: themeColors.muted, borderColor: themeColors.border }]}
                        placeholder="Quote, inside joke, or moment..."
                        placeholderTextColor={themeColors.textMuted}
                        multiline
                        value={content}
                        onChangeText={setContent}
                        maxLength={MAX_LENGTH}
                        textAlignVertical="top"
                        editable={!loading}
                    />
                    <Text style={[styles.counter, { color: themeColors.textMuted }]}>
                        {content.length} / {MAX_LENGTH}
                    </Text>
                    <TouchableOpacity
                        style={[
                            styles.submit,
                            canSubmit ? { borderColor: themeColors.primary } : { backgroundColor: themeColors.muted },
                        ]}
                        onPress={handleSubmit}
                        disabled={!canSubmit}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" size="small" />
                        ) : (
                            <Text style={[styles.submitText, !canSubmit && { color: themeColors.textMuted }]}>Post</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    card: { 
        borderRadius: 16, 
        padding: 24, 
        width: '90%', 
        maxWidth: 420,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { fontFamily: Fonts.heading, fontSize: 22 },
    closeBtn: { padding: 8 },
    input: { 
        minHeight: 120, 
        borderRadius: 12, 
        padding: 16, 
        fontFamily: Fonts.body, 
        fontSize: 16, 
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    counter: { fontFamily: Fonts.body, fontSize: 12, marginBottom: 16 },
    submit: { 
        height: 48, 
        borderRadius: 12, 
        justifyContent: 'center', 
        alignItems: 'center',
        borderWidth: 1,
        backgroundColor: '#fff',
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    submitText: { fontFamily: Fonts.heading, fontSize: 16, color: '#000' },
});
