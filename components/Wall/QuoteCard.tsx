import AppDialog, { type AppDialogAction } from "@/components/ui/AppDialog";
import { Colors, Fonts, Layout } from "@/constants/theme";
import { auth } from "@/firebaseConfig";
import { Quote, QuoteReply } from "@/hooks/useQuotes";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface QuoteCardProps {
  quote: Quote;
  onUpvote: () => void;
  onDelete: () => void;
  hasUpvoted: boolean;
  onSubscribeReplies: (
    quoteId: string,
    onReplies: (r: QuoteReply[]) => void,
  ) => () => void;
  onAddReply: (quoteId: string, content: string) => Promise<void>;
  index: number;
}

type DialogState = {
  title: string;
  message: string;
  actions?: AppDialogAction[];
} | null;

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  onUpvote,
  onDelete,
  hasUpvoted,
  onSubscribeReplies,
  onAddReply,
  index,
}) => {
  const paperColors = [
    { bg: "#FFFFFF", border: Colors.light.border },
    { bg: "#FDFBF7", border: Colors.light.border },
  ];
  const paper = paperColors[index % paperColors.length];

  const [replies, setReplies] = useState<QuoteReply[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
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
    if (d < 1) return "Today";
    if (d < 7) return `${d}d ago`;
    return new Date(t).toLocaleDateString();
  };

  const handleDelete = () => {
    setDialog({
      title: "Delete",
      message: "Remove this from the wall?",
      actions: [
        { label: "Cancel", variant: "secondary" },
        { label: "Delete", variant: "danger", onPress: onDelete },
      ],
    });
  };

  const handleAddReply = async () => {
    const t = replyText.trim();
    if (!t || submittingReply) return;
    setSubmittingReply(true);
    try {
      await onAddReply(quote.id, t);
      setReplyText("");
    } catch {
      setDialog({ title: "Error", message: "Could not add reply" });
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <>
      <View style={styles.wrapper}>
        <View
          style={[
            styles.card,
            { backgroundColor: paper.bg, borderColor: paper.border },
          ]}
        >
          <View
            style={[
              styles.tape,
              {
                backgroundColor:
                  index % 2 === 0
                    ? Colors.light.secondary
                    : Colors.light.primary,
                opacity: 0.4,
              },
            ]}
          />

          <View style={styles.row}>
            <Text style={styles.quoteText}>{`${quote.content}`}</Text>
            {isAuthor ? (
              <TouchableOpacity
                onPress={handleDelete}
                hitSlop={12}
                style={styles.deleteBtn}
              >
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={Colors.light.textMuted}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.meta}>
            <View style={styles.authorBadge}>
              <Text style={styles.author}>
                {quote.authorName.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.time}>
              {quote.createdAt?.seconds != null
                ? formatTime(quote.createdAt.seconds)
                : "Just now"}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={onUpvote}>
              <Ionicons
                name={hasUpvoted ? "heart" : "heart-outline"}
                size={18}
                color={hasUpvoted ? "#EF4444" : Colors.light.text}
              />
              <Text
                style={[styles.actionText, hasUpvoted && { color: "#EF4444" }]}
              >
                {quote.upvotesCount ?? 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowReplies(!showReplies)}
              style={styles.actionBtn}
            >
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color={Colors.light.text}
              />
              <Text style={styles.actionText}>{quote.repliesCount || 0}</Text>
            </TouchableOpacity>
          </View>
          {showReplies ? (
            <View style={styles.replies}>
              <ScrollView
                style={styles.repliesScroll}
                showsVerticalScrollIndicator
                nestedScrollEnabled
              >
                {replies.map((r) => (
                  <View key={r.id} style={styles.replyRow}>
                    <Text style={styles.replyAuthor}>
                      {r.authorName.toUpperCase()}
                    </Text>
                    <Text style={styles.replyContent}>{r.content}</Text>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.replyInputRow}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Add a reply..."
                  placeholderTextColor={Colors.light.textMuted}
                  value={replyText}
                  onChangeText={setReplyText}
                  editable={!submittingReply}
                />
                <TouchableOpacity
                  style={styles.sendBtn}
                  onPress={handleAddReply}
                  disabled={!replyText.trim() || submittingReply}
                >
                  <Ionicons name="send" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      <AppDialog
        visible={!!dialog}
        title={dialog?.title || ""}
        message={dialog?.message || ""}
        actions={dialog?.actions}
        onClose={() => setDialog(null)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 28,
    padding: 4,
  },
  card: {
    padding: 24,
    paddingTop: 32,
    borderRadius: Layout.radiusLarge,
    borderWidth: 2,
    borderColor: Colors.light.text,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 0,
    elevation: 4,
  },
  tape: {
    position: "absolute",
    top: -10,
    alignSelf: "center",
    width: 60,
    height: 20,
    zIndex: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  quoteText: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    lineHeight: 26,
    color: Colors.light.text,
    fontStyle: "italic",
  },
  deleteBtn: {
    marginLeft: 12,
    padding: 4,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  authorBadge: {
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.light.secondary,
    paddingBottom: 2,
  },
  author: {
    fontFamily: Fonts.heading,
    fontSize: 11,
    color: Colors.light.text,
    letterSpacing: 1,
  },
  time: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    borderTopWidth: 1.5,
    borderTopColor: Colors.light.border,
    paddingTop: 16,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.light.text,
  },
  replies: {
    marginTop: 20,
    padding: 16,
    paddingBottom: 8,
    backgroundColor: "#FDFBF7",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  repliesScroll: {
    maxHeight: 220,
    marginBottom: 8,
  },
  replyRow: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E2D9",
  },
  replyAuthor: {
    fontFamily: Fonts.heading,
    fontSize: 10,
    color: Colors.light.text,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  replyContent: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  replyInputRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  replyInput: {
    flex: 1,
    height: 44,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.light.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.light.text,
  },
});
