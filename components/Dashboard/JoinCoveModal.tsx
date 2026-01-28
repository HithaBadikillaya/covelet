import { Colors, Fonts } from '@/constants/theme';
import { auth, db } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { arrayUnion, collection, doc, getDocs, increment, query, updateDoc, where } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface JoinCoveModalProps {
    visible: boolean;
    onClose: () => void;
}

export const JoinCoveModal: React.FC<JoinCoveModalProps> = ({ visible, onClose }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const themeColors = Colors[isDark ? 'dark' : 'light'];

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleJoin = async () => {
        if (!code) {
            setError('Please enter a join code.');
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            setError('You must be logged in to join a Cove.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const q = query(collection(db, 'coves'), where('code', '==', code.toUpperCase()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('Invalid code. No Cove found with this code.');
                setLoading(false);
                return;
            }

            const coveDoc = querySnapshot.docs[0];
            const coveData = coveDoc.data();

            if (coveData.memberIds.includes(user.uid)) {
                setError('You are already a member of this Cove.');
                setLoading(false);
                return;
            }

            await updateDoc(doc(db, 'coves', coveDoc.id), {
                memberIds: arrayUnion(user.uid),
                memberCount: increment(1),
            });

            setCode('');
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to join Cove.');
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
                <View style={[styles.modalCard, { backgroundColor: isDark ? '#1A2A38' : '#F8FBFF' }]}>
                    <Text style={[styles.title, { color: themeColors.text }]}>Join a Cove</Text>
                    <Text style={[styles.subtitle, { color: themeColors.text }]}>
                        Enter the unique 6-character code shared by your circle.
                    </Text>

                    {error && <Text style={styles.errorText}>{error}</Text>}

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: themeColors.text }]}>Join Code</Text>
                        <TextInput
                            style={[styles.input, { borderColor: themeColors.sand, color: themeColors.text, textAlign: 'center', letterSpacing: 4, fontFamily: Fonts.heading, fontSize: 24 }]}
                            placeholder="ABC123"
                            placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                            value={code}
                            onChangeText={(text) => setCode(text.toUpperCase())}
                            maxLength={6}
                            autoCorrect={false}
                            autoCapitalize="characters"
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
                            onPress={handleJoin}
                            style={[styles.button, { backgroundColor: themeColors.ocean }]}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Join Cove</Text>
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
        height: 64,
        borderWidth: 1,
        paddingHorizontal: 16,
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
