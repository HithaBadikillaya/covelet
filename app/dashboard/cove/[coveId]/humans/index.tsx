import { AuthGuard } from '@/components/auth/AuthGuard';
import { CreateStoryModal } from '@/components/Cove/Humans/CreateStoryModal';
import { EditStoryModal } from '@/components/Cove/Humans/EditStoryModal';
import { StoryCard } from '@/components/Cove/Humans/StoryCard';
import { Colors, Fonts } from '@/constants/theme';
import { auth, db } from '@/firebaseConfig';
import { useStories } from '@/hooks/useStories';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HumansScreen() {
    const { coveId } = useLocalSearchParams<{ coveId: string }>();
    const themeColors = Colors.light;
    const insets = useSafeAreaInsets();
    const currentUser = auth.currentUser;

    const [coveOwnerId, setCoveOwnerId] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingStory, setEditingStory] = useState<{ id: string; content: string } | null>(
        null
    );
    const [editModalVisible, setEditModalVisible] = useState(false);

    const { stories, loading, error, createStory, deleteStory, editStory, toggleLike, hasLiked } =
        useStories(coveId);

    const isOwner = coveOwnerId === currentUser?.uid;

    // Fetch Cove owner ID
    useEffect(() => {
        if (!coveId) return;
        const unsubscribe = onSnapshot(doc(db, 'coves', coveId), (snap) => {
            if (snap.exists()) {
                setCoveOwnerId(snap.data().createdBy);
            }
        });
        return () => unsubscribe();
    }, [coveId]);

    // Close edit modal if story was deleted while modal is open (real-time sync)
    useEffect(() => {
        if (!editingStory || !editModalVisible) return;
        const stillExists = stories.some((s) => s.id === editingStory.id);
        if (!stillExists) {
            setEditModalVisible(false);
            setEditingStory(null);
        }
    }, [stories, editingStory, editModalVisible]);

    const handleCreateStory = async (content: string, isAnonymous: boolean) => {
        try {
            await createStory(content, isAnonymous);
        } catch (err: any) {
            throw err;
        }
    };

    const handleDeleteStory = async (storyId: string) => {
        try {
            await deleteStory(storyId);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete story');
        }
    };

    const handleEditStory = async (content: string) => {
        if (!editingStory) return;
        await editStory(editingStory.id, content);
        setEditingStory(null);
        setEditModalVisible(false);
    };

    const handleLike = async (storyId: string, currentLikesCount: number) => {
        try {
            await toggleLike(storyId, currentLikesCount);
        } catch (err: any) {
            // Optimistic UI will revert automatically via real-time listener
            console.error('Error toggling like:', err);
        }
    };

    const handleEditPress = (storyId: string, currentContent: string) => {
        setEditingStory({ id: storyId, content: currentContent });
        setEditModalVisible(true);
    };

    if (loading && stories.length === 0) {
        return (
            <AuthGuard>
                <View style={[styles.container, styles.centerAll, { backgroundColor: themeColors.background }]}>
                    <ActivityIndicator size="large" color={themeColors.primary} />
                </View>
            </AuthGuard>
        );
    }

    if (error && stories.length === 0) {
        return (
            <AuthGuard>
                <View style={[styles.container, styles.centerAll, { backgroundColor: themeColors.background }]}>
                    <Ionicons name="alert-circle-outline" size={64} color={themeColors.error} />
                    <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: themeColors.primary }]}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.retryText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: themeColors.text }]}>
                        Humans of Our Cove
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Stories Feed */}
                {stories.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={80} color={themeColors.textMuted} />
                        <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                            Every cove has stories.
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: themeColors.textMuted }]}>
                            Be the first to share.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={stories}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => (
                            <StoryCard
                                story={item}
                                onLike={() => handleLike(item.id, item.likesCount)}
                                onDelete={() => handleDeleteStory(item.id)}
                                onEdit={() => handleEditPress(item.id, item.content)}
                                hasLiked={hasLiked(item.id)}
                                isOwner={isOwner}
                            />
                        )}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                {/* Floating Action Button */}
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: themeColors.primary }]}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>

                {/* Create Story Modal */}
                <CreateStoryModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    onSubmit={handleCreateStory}
                />

                {/* Edit Story Modal */}
                {editingStory && (
                    <EditStoryModal
                        visible={editModalVisible}
                        onClose={() => {
                            setEditModalVisible(false);
                            setEditingStory(null);
                        }}
                        onSubmit={handleEditStory}
                        initialContent={editingStory.content}
                    />
                )}
            </View>
        </AuthGuard>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerAll: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 20,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontFamily: Fonts.heading,
        fontSize: 24,
        marginTop: 24,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontFamily: Fonts.body,
        fontSize: 16,
        marginTop: 8,
        textAlign: 'center',
    },
    errorText: {
        fontFamily: Fonts.body,
        fontSize: 16,
        marginTop: 16,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    retryText: {
        fontFamily: Fonts.heading,
        fontSize: 16,
        color: '#fff',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
