import { createCoveWithJoinCode } from '@/utils/coveJoinCodes';
import { generateRandomSeed, getCoveBackgroundUrl } from '@/utils/avatar';
import {
    normalizeAvatarSeed,
    normalizeMultilineText,
    normalizeSingleLineText,
    SECURITY_LIMITS,
} from '@/utils/security';
import { Colors, Fonts, Layout } from '@/constants/theme';
import { auth, db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface CreateCoveModalProps {
    visible: boolean;
    onClose: () => void;
    onCreate?: (coveId: string) => void;
}

const CreateCoveModal: React.FC<CreateCoveModalProps> = ({ visible, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [avatarSeed, setAvatarSeed] = useState(generateRandomSeed());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegenerateAvatar = () => {
        setAvatarSeed(generateRandomSeed());
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setAvatarSeed(generateRandomSeed());
        setError(null);
    };

    const handleCreate = async () => {
        const safeName = normalizeSingleLineText(name, SECURITY_LIMITS.coveName);
        const safeDescription = normalizeMultilineText(description, SECURITY_LIMITS.coveDescription);

        if (!safeName) {
            setError('Please name your cove.');
            return;
        }

        const user = auth?.currentUser;
        if (!user) {
            setError('Account required.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log("[TRACE] Creation flow: START", { name: safeName });
            const result = await createCoveWithJoinCode({
                userId: user.uid,
                name: safeName,
                description: safeDescription,
                avatarSeed: normalizeAvatarSeed(avatarSeed),
            });

            console.log("[TRACE] Creation flow: SUCCESS", result.coveId);
            resetForm();
            onClose();
            if (onCreate && result.coveId) {
                onCreate(result.coveId);
            }
        } catch (err: any) {
            console.error('[TRACE] Creation flow: ERROR', err);
            setError(err.message || 'Failed to create.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />

                <View style={styles.modalCard}>
                    <View style={styles.tape} />

                    <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
                        <Ionicons name="close" size={24} color={Colors.light.text} />
                    </TouchableOpacity>

                    <Text style={styles.title}>NEW COVE</Text>
                    <Text style={styles.subtitle}>
                        Every story needs a title. Give your sanctuary a name.
                    </Text>

                    {error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <Text style={styles.sectionTitle}>COVE PERSONALITY</Text>
                    <View style={styles.personalitySection}>
                        <View style={styles.previewWrapper}>
                            <Image
                                source={{ uri: getCoveBackgroundUrl(avatarSeed) }}
                                style={styles.previewBg}
                                contentFit="cover"
                            />
                        </View>
                        <TouchableOpacity style={styles.shuffleBtn} onPress={handleRegenerateAvatar}>
                            <Ionicons name="shuffle" size={18} color={Colors.light.primary} />
                            <Text style={styles.shuffleText}>SHUFFLE THEMES</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>COVE NAME</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Summer Memories"
                            placeholderTextColor={Colors.light.textMuted}
                            value={name}
                            onChangeText={setName}
                            maxLength={SECURITY_LIMITS.coveName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>DESCRIPTION (OPTIONAL)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="What is this cove for?"
                            placeholderTextColor={Colors.light.textMuted}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            maxLength={SECURITY_LIMITS.coveDescription}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleCreate}
                        style={[styles.createButton, loading && { opacity: 0.7 }]}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.createButtonText}>CREATE COVE</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(47, 46, 44, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalCard: {
        width: '100%',
        maxWidth: 400,
        padding: 32,
        paddingTop: 48,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: Colors.light.text,
        borderRadius: Layout.radiusLarge,
        shadowColor: '#000',
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 0,
        elevation: 8,
    },
    tape: {
        position: 'absolute',
        top: -12,
        alignSelf: 'center',
        width: 80,
        height: 24,
        backgroundColor: Colors.light.secondary,
        opacity: 0.5,
    },
    closeIcon: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 24,
        color: Colors.light.text,
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: 1,
    },
    subtitle: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.light.textMuted,
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 20,
    },
    sectionTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        color: Colors.light.text,
        marginBottom: 12,
        letterSpacing: 1,
    },
    personalitySection: {
        alignItems: 'center',
        marginBottom: 32,
        backgroundColor: '#FDFBF7',
        padding: 20,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: Colors.light.border,
    },
    previewWrapper: {
        width: '100%',
        height: 120,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: Colors.light.text,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    previewBg: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.8,
    },
    shuffleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 8,
    },
    shuffleText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        color: Colors.light.primary,
        letterSpacing: 0.5,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        color: Colors.light.text,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    input: {
        height: 52,
        borderWidth: 1.5,
        borderColor: Colors.light.border,
        backgroundColor: '#FDFBF7',
        paddingHorizontal: 16,
        fontFamily: Fonts.body,
        fontSize: 15,
        color: Colors.light.text,
        borderRadius: 0,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    createButton: {
        height: 56,
        backgroundColor: Colors.light.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        borderWidth: 2,
        borderColor: Colors.light.text,
        borderRadius: Layout.radiusMedium,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
        elevation: 4,
    },
    createButtonText: {
        fontFamily: Fonts.heading,
        fontSize: 15,
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    errorBox: {
        backgroundColor: '#FFF5F5',
        padding: 12,
        borderWidth: 1.5,
        borderColor: Colors.light.error,
        marginBottom: 20,
    },
    errorText: {
        color: Colors.light.error,
        fontFamily: Fonts.bodyMedium,
        fontSize: 13,
        textAlign: 'center',
    },
});

export default CreateCoveModal;