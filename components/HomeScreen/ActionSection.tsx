import { Colors, Fonts } from "@/constants/theme";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ActionSectionProps {
  onExplorePress: () => void;
}

export const ActionSection: React.FC<ActionSectionProps> = ({
  onExplorePress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.noteCard}>
        <Text style={styles.noteEyebrow}>START HERE</Text>
        <Text style={styles.noteTitle}>
          Open your dashboard, then start shaping the cove.
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push("/(tabs)/dashboard")}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>Open dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onExplorePress}
        style={styles.linkButton}
      ></TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 14,
  },
  noteCard: {
    backgroundColor: "#FFFDF8",
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    padding: 20,
  },
  noteEyebrow: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Colors.light.primary,
    marginBottom: 8,
  },
  noteTitle: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    lineHeight: 28,
    color: Colors.light.text,
    marginBottom: 8,
  },
  noteBody: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.light.textMuted,
  },
  primaryButton: {
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
    borderWidth: 2,
    borderColor: Colors.light.text,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: "#FFFFFF",
  },
  linkButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  linkButtonText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.light.primary,
  },
});
