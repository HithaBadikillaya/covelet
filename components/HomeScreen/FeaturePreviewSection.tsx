import { Colors, Fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const features = [
  {
    title: "Time Capsule",
    icon: "lock-closed-outline",
    accent: "#F4E2CF",
    description:
      "Write for your future selves and let the whole cove feel the unlock moment together.",
  },
  {
    title: "Members of the Cove",
    icon: "people-outline",
    accent: "#DCE8D5",
    description:
      "Keep each member visible as a real person, not just a username in a list.",
  },
  {
    title: "Wall",
    icon: "chatbubble-ellipses-outline",
    accent: "#F5EEE2",
    description:
      "Post everyday thoughts, inside jokes, and moments that deserve to stay in orbit.",
  },
  {
    title: "Mood Board",
    icon: "clipboard-outline",
    accent: "#F7EFD9",
    description:
      "Scatter sticky notes, move ideas around, and build a shared creative surface together.",
  },
  {
    title: "Constellation",
    icon: "sparkles-outline",
    accent: "#E7EEF8",
    description:
      "See wall memories become stars so the cove’s story feels visual, not buried.",
  },
  {
    title: "Memory Roulette",
    icon: "dice-outline",
    accent: "#F4E7EE",
    description:
      "Pull a random memory when you want surprise nostalgia instead of scrolling.",
  },
  {
    title: "Flashback",
    icon: "refresh-outline",
    accent: "#E8F0E7",
    description:
      "Bring back what happened on this day in earlier chapters of the cove.",
  },
] as const;

export const FeaturePreviewSection = () => {
  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <Text style={styles.header}>What the cove feels like</Text>
        <Text style={styles.subheader}>
          Each feature should feel like part of one scrapbook, not seven
          unrelated tools.
        </Text>
      </View>

      <View style={styles.cardList}>
        {features.map((feature) => (
          <View
            key={feature.title}
            style={[styles.card, { backgroundColor: feature.accent }]}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.iconBadge}>
                <Ionicons
                  name={feature.icon}
                  size={22}
                  color={Colors.light.text}
                />
              </View>
              <Text style={styles.cardTitle}>{feature.title}</Text>
            </View>
            <Text style={styles.cardDescription}>{feature.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 54,
    paddingHorizontal: 24,
    gap: 22,
  },
  headerWrap: {
    gap: 10,
  },
  header: {
    fontFamily: Fonts.heading,
    fontSize: 34,
    lineHeight: 38,
    color: Colors.light.text,
  },
  subheader: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 23,
    color: Colors.light.textMuted,
  },
  cardList: {
    gap: 16,
  },
  card: {
    borderWidth: 2,
    borderColor: Colors.light.text,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 0,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  iconBadge: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1,
    borderColor: Colors.light.text,
  },
  cardTitle: {
    flex: 1,
    fontFamily: Fonts.heading,
    fontSize: 20,
    color: Colors.light.text,
  },
  cardDescription: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.text,
  },
});
