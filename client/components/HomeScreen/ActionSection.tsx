import { Colors, Fonts } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ActionSectionProps {
  onExplorePress: () => void;
  onLogin: () => void;
  onSignup: () => void;
}

export const ActionSection: React.FC<ActionSectionProps> = ({
  onExplorePress,
  onLogin,
  onSignup,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.noteCard}>
        <Text style={styles.noteEyebrow}>START HERE</Text>
        <Text style={styles.noteTitle}>
          Open your dashboard, then start shaping the cove.
        </Text>
      </View>

      <View style={styles.authRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onLogin}
          style={[styles.primaryButton, { flex: 1 }]}
        >
          <Text style={styles.primaryButtonText}>LOG IN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onSignup}
          style={[styles.secondaryButton, { flex: 1 }]}
        >
          <Text style={styles.secondaryButtonText}>SIGN UP</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onExplorePress}
        style={styles.linkButton}
      >
        <Text style={styles.linkButtonText}>Explore Features ↓</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 14,
  },
  authRow: {
    flexDirection: 'row',
    gap: 12,
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
  primaryButton: {
    height: 54,
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
  secondaryButton: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: '#FFFFFF',
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
    fontSize: 14,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  secondaryButtonText: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    color: Colors.light.text,
    letterSpacing: 1,
  },
  linkButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  linkButtonText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.light.primary,
    textDecorationLine: 'underline',
  },
});
