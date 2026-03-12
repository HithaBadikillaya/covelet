import { Colors, Fonts } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface CreateCoveModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateCoveModal: React.FC<CreateCoveModalProps> = ({
  visible,
  onClose,
}) => {
  const themeColors = Colors.light;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateJoinCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreate = async () => {
    if (!name) {
      setError("Please enter a name for your Cove.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in to create a Cove.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const joinCode = generateJoinCode();
      await addDoc(collection(db, "coves"), {
        name,
        description,
        joinCode: joinCode,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        members: [user.uid],
        isActive: true,
      });

      setName("");
      setDescription("");
      onClose();
    } catch (err: any) {
      console.error("Error creating cove:", err);
      if (err.code === "permission-denied") {
        setError(
          "Security Restriction: You do not have permission to create this Cove. Please check your Firestore rules.",
        );
      } else {
        setError(err.message || "Failed to create Cove.");
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
          <Text style={[styles.title, { color: themeColors.text }]}>
            Create a New Cove
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
            Give your sanctuary a name and an optional description.
          </Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: themeColors.text }]}>
              Cove Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: themeColors.border,
                  color: themeColors.text,
                  backgroundColor: themeColors.background,
                },
              ]}
              placeholder="e.g., Summer 2024 Memories"
              placeholderTextColor={themeColors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: themeColors.text }]}>
              Description (Optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: themeColors.border,
                  color: themeColors.text,
                  backgroundColor: themeColors.background,
                  height: 100,
                  textAlignVertical: "top",
                  paddingTop: 12,
                },
              ]}
              placeholder="What is this cove for?"
              placeholderTextColor={themeColors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: "#fff",
                  borderColor: themeColors.primary,
                  borderWidth: 1,
                },
              ]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={[styles.buttonText, { color: "#000" }]}>CANCEL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.createButton,
                {
                  backgroundColor: "#fff",
                  borderColor: themeColors.primary,
                  borderWidth: 1,
                },
              ]}
              onPress={handleCreate}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={[styles.buttonText, { color: "#000" }]}>
                  CREATE COVE
                </Text>
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    padding: 32,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
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
    borderRadius: 12,
    borderColor: "rgba(0,0,0,0.05)",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  createButton: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonText: {
    fontWeight: "600",
    fontStyle: "normal",
    fontSize: 12,
  },
  errorText: {
    color: "#FF6B6B",
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    marginBottom: 20,
  },
});
