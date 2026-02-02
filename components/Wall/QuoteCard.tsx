import { Colors, Fonts } from '@/constants/theme';
import { auth } from '@/firebaseConfig';
import { Quote, QuoteReply } from '@/hooks/useQuotes';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface QuoteCardProps {
    quote: Quote;
    onUpvote: () => void;
    onDelete: () => void;
    hasUpvoted: boolean;
    onSubscribeReplies: (quoteId: string, onReplies: (r: QuoteReply[]) => void) => () => void;
    onAddReply: (quoteId: string, content: string) => Promise<void>;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({
    quote,
    onUpvote,
    onDelete,
    hasUpvoted,
    onSubscribeReplies,
    onAddReply,
}) => {
    const themeColors = Colors.light;
    const [replies, setReplies] = useState<QuoteReply[]>([]);
    const [showReplies, setShowReplies] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);
    const currentUser = auth.currentUser;
    const isAuthor = currentUser?.uid === quote.authorId;

    useEffect(() => {
        if (!showReplies) return;
        return onSubscribeReplies(quote.id, setReplies);
    }, [quote.id, showReplies, onSubscribeReplies]);

    const formatTime = (seconds: number) => {
        const now = Date.now();
        const t = seconds * 1000;
        const d = Math.floor((now - t) / 86400000);
        if (d < 1) return 'Today';
        if (d < 7) return `${d}d ago`;
        return new Date(t).toLocaleDateString();
    };

    const handleDelete = () => {
        Alert.alert('Delete', 'Remove this from the wall?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: onDelete },
        ]);
    };

    const handleAddReply = async () => {
        const t = replyText.trim();
        if (!t || submittingReply) return;
        setSubmittingReply(true);
        try {
            await onAddReply(quote.id, t);
            setReplyText('');
        } catch (e) {
            Alert.alert('Error', 'Could not add reply');
        } finally {
            setSubmittingReply(false);
        }
    };

    return (
        <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <View style={styles.row}>
                <Text style={[styles.content, { color: themeColors.text }]}>{quote.content}</Text>
                {isAuthor && (
                    <TouchableOpacity onPress={handleDelete} hitSlop={8}>
                        <Ionicons name="trash-outline" size={18} color={themeColors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.meta}>
                <Text style={[styles.author, { color: themeColors.textMuted }]}>{quote.authorName}</Text>
                <Text style={[styles.time, { color: themeColors.textMuted }]}>
                    {quote.createdAt?.seconds != null ? formatTime(quote.createdAt.seconds) : 'Just now'}
                </Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity style={styles.upvoteBtn} onPress={onUpvote}>
                    <Ionicons
                        name={hasUpvoted ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
                        size={22}
                        color={hasUpvoted ? themeColors.primary : themeColors.textMuted}
                    />
                    <Text style={[styles.upvoteCount, { color: themeColors.textMuted }]}>{quote.upvotesCount ?? 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowReplies(!showReplies)}>
                    <Text style={[styles.replyToggle, { color: themeColors.primary }]}>
                        {showReplies ? 'Hide replies' : `Replies (${replies.length})`}
                    </Text>
                </TouchableOpacity>
            </View>
            {showReplies && (
                <View style={styles.replies}>
                    {replies.map((r) => (
                        <View key={r.id} style={[styles.replyRow, { borderTopColor: themeColors.border }]}>
                            <Text style={[styles.replyAuthor, { color: themeColors.textMuted }]}>{r.authorName}</Text>
                            <Text style={[styles.replyContent, { color: themeColors.text }]}>{r.content}</Text>
                        </View>
                    ))}
                    <View style={styles.replyInputRow}>
                        <TextInput
                            style={[styles.replyInput, { color: themeColors.text, backgroundColor: themeColors.muted }]}
                            placeholder="Add a reply..."
                            placeholderTextColor={themeColors.textMuted}
                            value={replyText}
                            onChangeText={setReplyText}
                            editable={!submittingReply}
                        />
                        <TouchableOpacity
                            style={[styles.replyBtn, { backgroundColor: themeColors.primary }]}
                            onPress={handleAddReply}
                            disabled={!replyText.trim() || submittingReply}
                        >
                            <Text style={styles.replyBtnText}>Reply</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: { padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    content: { flex: 1, fontFamily: Fonts.body, fontSize: 16, lineHeight: 22 },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    author: { fontFamily: Fonts.bodyBold, fontSize: 13 },
    time: { fontFamily: Fonts.body, fontSize: 12 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    upvoteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    upvoteCount: { fontFamily: Fonts.bodyMedium, fontSize: 14 },
    replyToggle: { fontFamily: Fonts.body, fontSize: 14 },
    replies: { marginTop: 12, paddingTop: 12 },
    replyRow: { borderTopWidth: 1, paddingVertical: 8 },
    replyAuthor: { fontFamily: Fonts.bodyBold, fontSize: 12, marginBottom: 2 },
    replyContent: { fontFamily: Fonts.body, fontSize: 14 },
    replyInputRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    replyInput: { flex: 1, borderRadius: 8, padding: 10, fontFamily: Fonts.body, fontSize: 14 },
    replyBtn: { paddingHorizontal: 16, justifyContent: 'center', borderRadius: 20 },
    replyBtnText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: '#fff' },
});
