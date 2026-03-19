import AppDialog from '@/components/ui/AppDialog';
import { Colors, Fonts, Layout } from '@/constants/theme';
import { db, auth } from '@/firebaseConfig';
import { generateRandomSeed, getPfpUrl } from '@/utils/avatar';
import { getFallbackAvatarSeed } from '@/utils/memberProfile';
import { normalizeAvatarSeed, normalizeMultilineText, normalizeSingleLineText, SECURITY_LIMITS } from '@/utils/security';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface EditMemberCardModalProps {
    visible: boolean;
    onClose: () => void;
    coveId: string;
    currentMember: {
        id: string;
        avatarSeed: string;
        role?: string;
        bio?: string;
    };
}

export const EditMemberCardModal: React.FC<EditMemberCardModalProps> = ({ visible, onClose, coveId, currentMember }) => {
    const [role, setRole] = useState(currentMember.role || '');
    const [bio, setBio] = useState(currentMember.bio || '');
    const [avatarSeed, setAvatarSeed] = useState(getFallbackAvatarSeed(currentMember.id, currentMember.avatarSeed));
    const [loading, setLoading] = useState(false);
    const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);

    const handleRegenerateAvatar = () => {
        setAvatarSeed(generateRandomSeed());
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Not authenticated');

            const safeAvatarSeed = normalizeAvatarSeed(avatarSeed);
            const safeRole = normalizeSingleLineText(role, SECURITY_LIMITS.memberRole);
            const safeBio = normalizeMultilineText(bio, SECURITY_LIMITS.memberBio);
            const memberDocRef = doc(db, 'coves', coveId, 'members_data', user.uid);
            const existingMemberDoc = await getDoc(memberDocRef);

            await updateDoc(doc(db, 'users', user.uid), {
                avatarSeed: safeAvatarSeed,
                updatedAt: serverTimestamp(),
            });

            const payload: Record<string, unknown> = {
                role: safeRole,
                bio: safeBio,
                updatedAt: serverTimestamp(),
            };

            if (!existingMemberDoc.exists()) {
                payload.joinedAt = serverTimestamp();
            }

            await setDoc(memberDocRef, payload, { merge: true });
            onClose();
        } catch (err: any) {
            setDialog({ title: 'Error', message: err.message || 'Failed to save changes' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
                    <Pressable style={styles.backdrop} onPress={onClose} />
                    <View style={styles.card}>
                        <View style={styles.header}>
                            <Text style={styles.title}>PERSONALIZE YOUR CARD</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={Colors.light.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.avatarSection}>
                                <View style={styles.pfpWrapper}>
                                    <Image source={{ uri: getPfpUrl(avatarSeed) }} style={styles.pfp} contentFit="contain" />
                                </View>
                                <TouchableOpacity style={styles.regenerateBtn} onPress={handleRegenerateAvatar}>
                                    <Ionicons name="refresh" size={16} color={Colors.light.primary} />
                                    <Text style={styles.regenerateText}>REGENERATE AVATAR</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>COVE ROLE</Text>
                                <TextInput style={styles.input} placeholder="e.g. The Historian, Lead Explorer" placeholderTextColor={Colors.light.textMuted} value={role} onChangeText={setRole} maxLength={SECURITY_LIMITS.memberRole} />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>BIO</Text>
                                <TextInput style={[styles.input, styles.textArea]} placeholder="Tell the tribe something about yourself..." placeholderTextColor={Colors.light.textMuted} value={bio} onChangeText={setBio} multiline maxLength={SECURITY_LIMITS.memberBio} />
                            </View>
                            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.light.primary }]} onPress={handleSave} disabled={loading}>
                                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>SAVE MY PERSONALITY</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            <AppDialog visible={!!dialog} title={dialog?.title || ''} message={dialog?.message || ''} onClose={() => setDialog(null)} />
        </>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(47, 46, 44, 0.4)' },
    card: { backgroundColor: '#FFFFFF', borderRadius: Layout.radiusLarge, padding: 24, width: '90%', maxWidth: 420, maxHeight: '80%', borderWidth: 2, borderColor: Colors.light.text, shadowColor: '#000', shadowOffset: { width: 8, height: 8 }, shadowOpacity: 0.1, shadowRadius: 0, elevation: 10 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontFamily: Fonts.heading, fontSize: 18, color: Colors.light.text, letterSpacing: 1 },
    closeBtn: { padding: 4 },
    avatarSection: { alignItems: 'center', marginBottom: 24 },
    pfpWrapper: { width: 100, height: 100, borderRadius: 0, backgroundColor: '#F9F7F2', borderWidth: 2, borderColor: Colors.light.text, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    pfp: { width: '80%', height: '80%' },
    regenerateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
    regenerateText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.light.primary, letterSpacing: 0.5 },
    inputGroup: { marginBottom: 20 },
    label: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.light.text, marginBottom: 8, letterSpacing: 0.5 },
    input: { backgroundColor: '#FDFBF7', borderWidth: 1.5, borderColor: Colors.light.border, padding: 12, fontFamily: Fonts.body, fontSize: 15, color: Colors.light.text },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    saveBtn: { height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 10, borderWidth: 2, borderColor: Colors.light.text, shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.1, shadowRadius: 0, elevation: 4 },
    saveBtnText: { fontFamily: Fonts.heading, fontSize: 14, color: '#FFFFFF', letterSpacing: 1 },
});