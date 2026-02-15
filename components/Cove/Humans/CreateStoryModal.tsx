import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Fonts } from "@/constants/theme";
import { auth } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface CreateStoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (content: string, isAnonymous: boolean) => Promise<void>;
}

const MAX_WORDS = 500;

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  const trimmedContent = content.trim();
  const wordCount =
    trimmedContent.length > 0
      ? trimmedContent.split(/\s+/).filter((w) => w.length > 0).length
      : 0;
  const isOverLimit = wordCount > MAX_WORDS;
  const canSubmit = trimmedContent.length > 0 && !isOverLimit && !loading;

  const handleClose = () => {
    if (!loading) {
      setContent("");
      setIsAnonymous(false);
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!trimmedContent) {
      Alert.alert("Empty Story", "Please write something before sharing.");
      return;
    }
    if (isOverLimit) {
      Alert.alert(
        "Story Too Long",
        `Your story is ${wordCount} words. Please keep it under ${MAX_WORDS} words.`
      );
      return;
    }
    setLoading(true);
    try {
      await onSubmit(trimmedContent, isAnonymous);
      setContent("");
      setIsAnonymous(false);
      onClose();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create story");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Share Your Story</Text>
              <Text style={styles.subtitle}>What moment do you want to share?</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} disabled={loading}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* User info */}
          {currentUser && (
            <View style={styles.userIdentitySection}>
              <Avatar className="h-10 w-10">
                {currentUser.photoURL ? (
                  <AvatarImage src={currentUser.photoURL} alt={currentUser.displayName || "User"} />
                ) : null}
                <AvatarFallback className="bg-primary">
                  <Text style={styles.avatarText}>
                    {currentUser.displayName
                      ? currentUser.displayName.substring(0, 2).toUpperCase()
                      : "U"}
                  </Text>
                </AvatarFallback>
              </Avatar>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {isAnonymous ? "Anonymous" : currentUser.displayName || "User"}
                </Text>
                <Text style={styles.userHint}>
                  {isAnonymous ? "Your identity will be hidden" : "Posting as yourself"}
                </Text>
              </View>
            </View>
          )}

          {/* Text input */}
          <TextInput
            style={styles.textInput}
            placeholder="Tell us your story..."
            placeholderTextColor="#aaaaaa"
            multiline
            value={content}
            onChangeText={setContent}
            editable={!loading}
            autoFocus
            textAlignVertical="top"
          />

          <View style={styles.counterRow}>
            <Text style={[styles.counter, { color: isOverLimit ? "#ff6666" : "#cccccc" }]}>
              {wordCount} / {MAX_WORDS} words
            </Text>
            {isOverLimit && <Text style={styles.errorText}>Reduce story length</Text>}
          </View>

          {/* Anonymous toggle */}
          <View style={styles.anonymousRow}>
            <View style={styles.anonymousInfo}>
              <Ionicons
                name={isAnonymous ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={isAnonymous ? "#D2A679" : "#cccccc"}
              />
              <View style={styles.anonymousTextContainer}>
                <Text style={styles.anonymousLabel}>Post anonymously</Text>
                <Text style={styles.anonymousHint}>
                  {isAnonymous ? "Your name and avatar will be hidden" : "Your name and avatar will be visible"}
                </Text>
              </View>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              disabled={loading}
              trackColor={{ false: "#333", true: "#D2A679" }}
              thumbColor="#fff"
            />
          </View>

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: canSubmit ? "#D2A679" : "#555" }]}
            onPress={handleSubmit}
            disabled={!canSubmit || loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Share Story</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  card: {
    borderRadius: 24,
    padding: 24,
    width: "90%",
    maxWidth: 420,
    maxHeight: "85%",
    backgroundColor: "#121212",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  headerContent: { flex: 1, marginRight: 12 },
  title: { fontFamily: Fonts.heading, fontSize: 24, color: "#fff", marginBottom: 4 },
  subtitle: { fontFamily: Fonts.body, fontSize: 14, color: "#bbbbbb" },
  closeBtn: { padding: 8 },
  userIdentitySection: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#1a1a1a", borderRadius: 16, marginBottom: 20, gap: 12 },
  avatarText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: "#fff" },
  userInfo: { flex: 1 },
  userName: { fontFamily: Fonts.bodyBold, fontSize: 16, color: "#fff", marginBottom: 2 },
  userHint: { fontFamily: Fonts.body, fontSize: 12, color: "#bbbbbb" },
  textInput: { minHeight: 160, borderRadius: 16, padding: 16, fontFamily: Fonts.body, fontSize: 16, lineHeight: 24, borderWidth: 1, borderColor: "#333", color: "#fff", backgroundColor: "#1a1a1a", marginBottom: 12 },
  counterRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  counter: { fontFamily: Fonts.bodyMedium, fontSize: 12 },
  errorText: { fontFamily: Fonts.body, fontSize: 12, color: "#ff6666" },
  anonymousRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, borderTopWidth: 1, borderTopColor: "#333" },
  anonymousInfo: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  anonymousTextContainer: { flex: 1 },
  anonymousLabel: { fontFamily: Fonts.bodyBold, fontSize: 16, color: "#fff", marginBottom: 2 },
  anonymousHint: { fontFamily: Fonts.body, fontSize: 12, color: "#bbbbbb" },
  submitButton: { height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center", marginTop: 8 },
  submitText: { fontFamily: Fonts.heading, fontSize: 18, color: "#fff", letterSpacing: 1 },
});
