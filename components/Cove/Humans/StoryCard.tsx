import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Colors, Fonts } from '@/constants/theme';
import { auth } from '@/firebaseConfig';
import { Story } from '@/hooks/useStories';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface StoryCardProps {
    story: Story;
    onLike: () => void;
    onDelete: () => void;
    onEdit: () => void;
    hasLiked: boolean;
    isOwner: boolean;
}

export const StoryCard: React.FC<StoryCardProps> = ({
    story,
    onLike,
    onDelete,
    onEdit,
    hasLiked,
    isOwner,
}) => {
    const themeColors = Colors.light;
    const currentUser = auth.currentUser;
    const isAuthor = currentUser?.uid === story.authorId;

    const formatTimeAgo = (seconds: number) => {
        const now = Date.now();
        const storyTime = seconds * 1000;
        const diffMs = now - storyTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return new Date(storyTime).toLocaleDateString();
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Story',
            'Are you sure you want to delete this story?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: onDelete,
                },
            ]
        );
    };

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const displayName = story.isAnonymous ? 'Anonymous' : story.authorName;
    const displayAvatar = story.isAnonymous ? null : story.authorAvatar;

    return (
        <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.authorInfo}>
                    <Avatar className="h-10 w-10">
                        {displayAvatar ? (
                            <AvatarImage src={displayAvatar} alt={displayName} />
                        ) : null}
                        <AvatarFallback className="bg-primary">
                            <Text style={styles.avatarText}>
                                {getInitials(displayName)}
                            </Text>
                        </AvatarFallback>
                    </Avatar>
                    <View style={styles.authorDetails}>
                        <Text style={[styles.authorName, { color: themeColors.text }]}>
                            {displayName}
                        </Text>
                        <Text style={[styles.timeAgo, { color: themeColors.textMuted }]}>
                            {story.createdAt?.seconds != null
                                ? formatTimeAgo(story.createdAt.seconds)
                                : 'Just now'}
                        </Text>
                    </View>
                </View>

                {/* Actions Menu */}
                {(isAuthor || isOwner) && (
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert(
                                'Story Options',
                                '',
                                [
                                    ...(isAuthor
                                        ? [
                                              {
                                                  text: 'Edit',
                                                  onPress: onEdit,
                                              },
                                          ]
                                        : []),
                                    {
                                        text: 'Delete',
                                        style: 'destructive',
                                        onPress: handleDelete,
                                    },
                                    { text: 'Cancel', style: 'cancel' },
                                ]
                            );
                        }}
                    >
                        <Ionicons
                            name="ellipsis-horizontal"
                            size={20}
                            color={themeColors.textMuted}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Content */}
            <Text style={[styles.content, { color: themeColors.text }]}>
                {story.content}
            </Text>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.likeButton}
                    onPress={onLike}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={hasLiked ? 'heart' : 'heart-outline'}
                        size={20}
                        color={hasLiked ? themeColors.error : themeColors.textMuted}
                    />
                    <Text
                        style={[
                            styles.likeCount,
                            {
                                color: hasLiked
                                    ? themeColors.error
                                    : themeColors.textMuted,
                            },
                        ]}
                    >
                        {story.likesCount}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    authorDetails: {
        flex: 1,
    },
    authorName: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        marginBottom: 2,
    },
    timeAgo: {
        fontFamily: Fonts.body,
        fontSize: 12,
    },
    avatarText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        color: '#fff',
    },
    content: {
        fontFamily: Fonts.body,
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 16,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    likeCount: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
    },
});
