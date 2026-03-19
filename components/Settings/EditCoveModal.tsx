import { Colors, Fonts, Layout } from '@/constants/theme';
import { db } from '@/firebaseConfig';
import { generateRandomSeed, getCoveBackgroundUrl } from '@/utils/avatar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface EditCoveModalProps {
    visible: boolean;
    onClose: () => void;
    coveId: string;
    initialName: string;
    initialDescription: string;
    initialAvatarSeed: string;
}

const resolveAvatarSeed = (seed?: string) => {
    return seed && seed.trim() ? seed : generateRandomSeed();
};

export const EditCoveModal: React.FC<EditCoveModalProps> = ({
    visible,
    onClose,
    coveId,
    initialName,
    initialDescription,
    initialAvatarSeed,
}) => {
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription || '');
    const [avatarSeed, setAvatarSeed] = useState(resolveAvatarSeed(initialAvatarSeed));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (visible) {
            setName(initialName);
            setDescription(initialDescription || '');
            setAvatarSeed(resolveAvatarSeed(initialAvatarSeed));
            setError(null);
        }
    }, [visible, initialName, initialDescription, initialAvatarSeed]);

    const handleRegenerateAvatar = () => {
        setAvatarSeed(generateRandomSeed());
    };

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Please provide a name for your cove.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await updateDoc(doc(db, 'coves', coveId), {
                name: name.trim(),
                description: description.trim(),
                avatarSeed,
            });
            onClose();
        } catch (err: any) {
            console.error('Error updating cove:', err);
            setError(err.message || 'Failed to update details.');
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

                    <TouchableOpacity
                        style={styles.closeIcon}
                        onPress={onClose}
                    >
                        <Ionicons name="close" size={24} color={Colors.light.text} />
                    </TouchableOpacity>

                    <Text style={styles.title}>EDIT COVE</Text>
                    <Text style={styles.subtitle}>
                        Update the cove name, description, and avatar theme from one place.
                    </Text>

                    {error && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <Text style={styles.sectionTitle}>COVE AVATAR</Text>
                    <View style={styles.personalitySection}>
                        <View style={styles.previewCard}>
                            <Image
                                source={{ uri: getCoveBackgroundUrl(avatarSeed) }}
                                style={styles.previewBg}
                                contentFit="cover"
                            />
                            <View style={styles.previewOverlay}>
                                <Text style={styles.previewName} numberOfLines={1}>
                                    {(name || 'Your Cove').trim()}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.shuffleBtn}
                            onPress={handleRegenerateAvatar}
                        >
                            <Ionicons name="shuffle" size={18} color={Colors.light.primary} />
                            <Text style={styles.shuffleText}>CHANGE AVATAR THEME</Text>
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
                            maxLength={50}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>DESCRIPTION</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="What is this cove for?"
                            placeholderTextColor={Colors.light.textMuted}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            maxLength={180}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleSave}
                        style={[styles.createButton, loading && { opacity: 0.7 }]}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.createButtonText}>SAVE CHANGES</Text>
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
        color: Colors.light.text,
        fontFamily: Fonts.heading,
        fontSize: 24,
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: 1,
    },
    subtitle: {
        color: Colors.light.textMuted,
        fontFamily: Fonts.body,
        fontSize: 14,
        marginBottom: 28,
        textAlign: 'center',
        lineHeight: 20,
    },
    sectionTitle: {
        fontFamily: Fonts.heading,
        fontSize: 12,
        color: Colors.light.textMuted,
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    personalitySection: {
        marginBottom: 24,
    },
    previewCard: {
        height: 132,
        borderRadius: Layout.radiusMedium,
        borderWidth: 2,
        borderColor: Colors.light.text,
        overflow: 'hidden',
        marginBottom: 12,
        backgroundColor: '#F0F4EF',
    },
    previewBg: {
        ...StyleSheet.absoluteFillObject,
    },
    previewOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 16,
        backgroundColor: 'rgba(47, 46, 44, 0.12)',
    },
    previewName: {
        fontFamily: Fonts.heading,
        fontSize: 18,
        color: '#FFFFFF',
        letterSpacing: 0.8,
    },
    shuffleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F0F4EF',
        borderRadius: Layout.radiusMedium,
        borderWidth: 1.5,
        borderColor: Colors.light.border,
    },
    shuffleText: {
        fontFamily: Fonts.heading,
        fontSize: 12,
        color: Colors.light.text,
        letterSpacing: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontFamily: Fonts.heading,
        fontSize: 12,
        color: Colors.light.text,
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    input: {
        fontFamily: Fonts.body,
        fontSize: 16,
        color: Colors.light.text,
        backgroundColor: '#FDFBF7',
        borderWidth: 2,
        borderColor: Colors.light.border,
        borderRadius: 0,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 16,
    },
    errorBox: {
        padding: 12,
        backgroundColor: '#FEF2F2',
        borderWidth: 1.5,
        borderColor: Colors.light.error,
        marginBottom: 24,
        alignItems: 'center',
    },
    errorText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.light.error,
    },
    createButton: {
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.light.primary,
        borderRadius: Layout.radiusMedium,
        borderWidth: 2,
        borderColor: Colors.light.text,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
        marginTop: 12,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontFamily: Fonts.heading,
        fontSize: 14,
        letterSpacing: 1,
    },
});
