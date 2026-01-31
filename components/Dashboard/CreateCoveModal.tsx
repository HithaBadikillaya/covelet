import { Colors, Fonts } from '@/constants/theme';
import { auth, db } from '@/firebaseConfig';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface CreateCoveModalProps {
    visible: boolean;
    onClose: () => void;
}

export const CreateCoveModal: React.FC<CreateCoveModalProps> = ({ visible, onClose }) => {
    const themeColors = Colors.light;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateJoinCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleCreate = async () => {
        if (!name) {
            setError('Please enter a name for your Cove.');
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            setError('You must be logged in to create a Cove.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const joinCode = generateJoinCode();
            await addDoc(collection(db, 'coves'), {
                name,
                description,
                joinCode: joinCode,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
                members: [user.uid],
                isActive: true,
            });

            setName('');
            setDescription('');
            onClose();
        } catch (err: any) {
            console.error('Error creating cove:', err);
            if (err.code === 'permission-denied') {
                setError('Security Restriction: You do not have permission to create this Cove. Please check your Firestore rules.');
            } else {
                setError(err.message || 'Failed to create Cove.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalCard, { backgroundColor: themeColors.card }]}>
                    <Text style={[styles.title, { color: themeColors.text }]}>Create a New Cove</Text>
                    <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
                        Give your sanctuary a name and an optional description.
                    </Text>

                    {error && <Text style={styles.errorText}>{error}</Text>}

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: themeColors.text }]}>Cove Name</Text>
                        <TextInput
                            style={[styles.input, { borderColor: themeColors.border, color: themeColors.text, backgroundColor: themeColors.background }]}
                            placeholder="e.g., Summer 2024 Memories"
                            placeholderTextColor={themeColors.textMuted}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: themeColors.text }]}>Description (Optional)</Text>
                        <TextInput
                            style={[styles.input, { borderColor: themeColors.border, color: themeColors.text, backgroundColor: themeColors.background, height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                            placeholder="What is this cove for?"
                            placeholderTextColor={themeColors.textMuted}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                        />
                    </View>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.button, { backgroundColor: 'transparent' }]}
                        >
                            <Text style={[styles.buttonText, { color: themeColors.text, opacity: 0.6 }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleCreate}
                            style={[styles.button, { backgroundColor: themeColors.primary }]}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={themeColors.background} />
                            ) : (
                                <Text style={[styles.buttonText, { color: themeColors.background }]}>Create Cove</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalCard: {
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 24,
        marginBottom: 12,
    },
    subtitle: {
        fontFamily: Fonts.body,
        fontSize: 16,
        marginBottom: 32,
        opacity: 0.7,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        height: 56,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontFamily: Fonts.body,
        fontSize: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16,
        marginTop: 16,
    },
    button: {
        height: 56,
        paddingHorizontal: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontFamily: Fonts.heading,
        fontSize: 16,
    },
    errorText: {
        color: '#FF6B6B',
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        marginBottom: 20,
    },
});
