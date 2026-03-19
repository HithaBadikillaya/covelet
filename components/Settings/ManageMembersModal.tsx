import AppDialog, { type AppDialogAction } from '@/components/ui/AppDialog';
import { Colors, Fonts, Layout } from '@/constants/theme';
import { auth, db } from '@/firebaseConfig';
import { useCoveMembers } from '@/hooks/useCoveMembers';
import { getPfpUrl } from '@/utils/avatar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { arrayRemove, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ManageMembersModalProps {
    visible: boolean;
    onClose: () => void;
    coveId: string;
}

type DialogState = {
    title: string;
    message: string;
    actions?: AppDialogAction[];
} | null;

export const ManageMembersModal: React.FC<ManageMembersModalProps> = ({ visible, onClose, coveId }) => {
    const { members, ownerId, loading, error } = useCoveMembers(coveId);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [dialog, setDialog] = useState<DialogState>(null);

    const removableCount = members.filter((member) => member.id !== ownerId).length;

    const showDialog = (title: string, message: string, actions?: AppDialogAction[]) => {
        setDialog({ title, message, actions });
    };

    const handleRemove = (memberId: string, memberName: string) => {
        if (memberId === ownerId) {
            showDialog('Owner Protected', 'The cove owner cannot be removed from the members list.');
            return;
        }

        showDialog('Remove Member', `Are you sure you want to remove ${memberName} from this Cove? They will lose access immediately.`, [
            { label: 'Cancel', variant: 'secondary' },
            {
                label: 'Remove',
                variant: 'danger',
                onPress: async () => {
                    try {
                        setRemovingId(memberId);
                        await updateDoc(doc(db, 'coves', coveId), {
                            members: arrayRemove(memberId),
                        });
                        await deleteDoc(doc(db, 'coves', coveId, 'members_data', memberId));
                        showDialog('Member Removed', `${memberName} has been removed from this Cove.`);
                    } catch (err) {
                        console.error('Error removing member:', err);
                        showDialog('Error', 'Failed to remove member.');
                    } finally {
                        setRemovingId(null);
                    }
                },
            },
        ]);
    };

    return (
        <>
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

                        <Text style={styles.title}>MANAGE MEMBERS</Text>
                        <Text style={styles.subtitle}>
                            View everyone in this cove and remove members when needed.
                        </Text>

                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>{members.length} TOTAL MEMBERS</Text>
                            <Text style={styles.summaryText}>
                                {removableCount > 0
                                    ? `${removableCount} member${removableCount === 1 ? '' : 's'} can be removed by the owner.`
                                    : 'Only the owner is left in this cove.'}
                            </Text>
                        </View>

                        {loading && members.length === 0 ? (
                            <ActivityIndicator style={styles.loader} color={Colors.light.primary} />
                        ) : error ? (
                            <Text style={styles.errorText}>{error}</Text>
                        ) : (
                            <FlatList
                                data={members}
                                keyExtractor={(item) => item.id}
                                style={styles.list}
                                contentContainerStyle={styles.listContent}
                                showsVerticalScrollIndicator={false}
                                ListEmptyComponent={
                                    <View style={styles.emptyState}>
                                        <Text style={styles.emptyTitle}>No members found</Text>
                                        <Text style={styles.emptyText}>This cove has no member records yet.</Text>
                                    </View>
                                }
                                renderItem={({ item }) => {
                                    const isOwner = item.id === ownerId;
                                    const isCurrentUser = item.id === auth.currentUser?.uid;
                                    const isRemoving = removingId === item.id;
                                    const metaLabel = [
                                        isOwner ? 'OWNER' : '',
                                        isCurrentUser ? 'YOU' : '',
                                    ].filter(Boolean).join(' / ');

                                    return (
                                        <View style={styles.memberRow}>
                                            <Image
                                                source={{ uri: getPfpUrl(item.avatarSeed) }}
                                                style={styles.avatar}
                                            />

                                            <View style={styles.memberInfo}>
                                                <Text style={styles.memberName}>{item.name || 'Unknown Spirit'}</Text>
                                                {metaLabel ? (
                                                    <Text style={styles.memberMeta}>{metaLabel}</Text>
                                                ) : item.role ? (
                                                    <Text style={styles.memberMeta}>{item.role}</Text>
                                                ) : null}
                                            </View>

                                            {isOwner ? (
                                                <View style={styles.ownerPill}>
                                                    <Text style={styles.ownerPillText}>KEEP</Text>
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    style={[styles.removeBtn, isRemoving && styles.removeBtnDisabled]}
                                                    onPress={() => handleRemove(item.id, item.name || 'Unknown Spirit')}
                                                    disabled={isRemoving}
                                                >
                                                    {isRemoving ? (
                                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                                    ) : (
                                                        <>
                                                            <Ionicons name="person-remove" size={16} color="#FFFFFF" />
                                                            <Text style={styles.removeText}>REMOVE</Text>
                                                        </>
                                                    )}
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    );
                                }}
                            />
                        )}
                    </View>
                </View>
            </Modal>

            <AppDialog
                visible={!!dialog}
                title={dialog?.title || ''}
                message={dialog?.message || ''}
                actions={dialog?.actions}
                onClose={() => setDialog(null)}
            />
        </>
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
        maxWidth: 420,
        maxHeight: '82%',
        padding: 24,
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
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20,
    },
    summaryCard: {
        backgroundColor: '#FDFBF7',
        borderWidth: 1.5,
        borderColor: Colors.light.border,
        borderStyle: 'dashed',
        padding: 14,
        marginBottom: 16,
    },
    summaryTitle: {
        fontFamily: Fonts.heading,
        fontSize: 12,
        color: Colors.light.text,
        letterSpacing: 1,
        marginBottom: 6,
    },
    summaryText: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.light.textMuted,
        lineHeight: 18,
    },
    loader: {
        marginVertical: 32,
    },
    list: {
        flexGrow: 0,
    },
    listContent: {
        paddingBottom: 12,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        gap: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F0F4EF',
        borderWidth: 1.5,
        borderColor: Colors.light.border,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontFamily: Fonts.heading,
        fontSize: 15,
        color: Colors.light.text,
    },
    memberMeta: {
        fontFamily: Fonts.body,
        fontSize: 11,
        color: Colors.light.textMuted,
        marginTop: 3,
        letterSpacing: 0.4,
    },
    ownerPill: {
        minWidth: 76,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        backgroundColor: '#F0F4EF',
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: Colors.light.border,
    },
    ownerPillText: {
        fontFamily: Fonts.heading,
        fontSize: 11,
        color: Colors.light.primary,
        letterSpacing: 0.8,
    },
    removeBtn: {
        minWidth: 102,
        height: 38,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.light.error,
        borderRadius: 19,
        paddingHorizontal: 12,
    },
    removeBtnDisabled: {
        opacity: 0.75,
    },
    removeText: {
        fontFamily: Fonts.heading,
        fontSize: 11,
        color: '#FFFFFF',
        letterSpacing: 0.8,
    },
    errorText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.light.error,
        textAlign: 'center',
        marginVertical: 20,
        lineHeight: 20,
    },
    emptyState: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    emptyTitle: {
        fontFamily: Fonts.heading,
        fontSize: 14,
        color: Colors.light.text,
        marginBottom: 6,
    },
    emptyText: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.light.textMuted,
        textAlign: 'center',
    },
});