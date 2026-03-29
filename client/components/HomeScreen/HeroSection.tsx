import { Colors, Fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const HIGHLIGHTS = [
  { icon: "lock-closed-outline", label: "Private by default" },
  { icon: "people-outline", label: "Built for real groups" },
  { icon: "sparkles-outline", label: "Made for memory keeping" },
] as const;

export const HeroSection = () => {
  return (
    <View style={styles.container}>
      <View style={styles.storyCard}>
        <View style={styles.badgeRow}>
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>
              SCRAPBOOK APP FOR CLOSE CIRCLES
            </Text>
          </View>
          <View style={styles.dateTag}>
            <Text style={styles.dateTagText}>VOL. 01</Text>
          </View>
        </View>

        <Text style={styles.title}>Keep the small things alive.</Text>
        <Text style={styles.subtitle}>
          Covelet turns group memories into something you can revisit, play
          with, and grow over time instead of letting them disappear into old
          chats.
        </Text>

        <View style={styles.highlightList}>
          {HIGHLIGHTS.map((item) => (
            <View key={item.label} style={styles.highlightChip}>
              <Ionicons
                name={item.icon}
                size={18}
                color={Colors.light.primary}
              />
              <Text style={styles.highlightText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.collageRow}>
        <View style={[styles.collageCard, styles.mainCard]}>
          <Text style={styles.cardEyebrow}>INSIDE A COVE</Text>
          <Text style={styles.cardTitle}>
            Wall posts, board notes, constellation memories, flashbacks, and
            time capsules.
          </Text>
          <Text style={styles.cardBody}>
            Everything feels like one living scrapbook instead of a bunch of
            disconnected features.
          </Text>
        </View>

        <View style={styles.sideStack}>
          <View style={[styles.collageCard, styles.sideCardTop]}>
            <Text style={styles.statNumber}>7</Text>
            <Text style={styles.statLabel}>Memory spaces working together</Text>
          </View>
          <View style={[styles.collageCard, styles.sideCardBottom]}>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>
              Your people, your pace, your stories
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    gap: 20,
  },
  storyCard: {
    backgroundColor: "#FFFDF8",
    borderWidth: 2,
    borderColor: Colors.light.text,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 0,
    elevation: 8,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  badgePill: {
    backgroundColor: "#F6EFE4",
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
    color: Colors.light.primary,
  },
  dateTag: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.light.primary,
  },
  dateTagText: {
    fontFamily: Fonts.heading,
    fontSize: 11,
    letterSpacing: 1,
    color: "#FFFFFF",
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 44,
    lineHeight: 48,
    color: Colors.light.text,
    marginBottom: 14,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 17,
    lineHeight: 26,
    color: Colors.light.text,
    marginBottom: 20,
  },
  highlightList: {
    gap: 10,
  },
  highlightChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F9F5EC",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  highlightText: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.light.text,
  },
  collageRow: {
    gap: 16,
  },
  collageCard: {
    borderWidth: 2,
    borderColor: Colors.light.text,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 0,
    elevation: 6,
  },
  mainCard: {
    backgroundColor: "#DCE8D5",
  },
  sideStack: {
    gap: 16,
  },
  sideCardTop: {
    backgroundColor: "#F4E2CF",
  },
  sideCardBottom: {
    backgroundColor: "#F5EEE2",
  },
  cardEyebrow: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: Colors.light.primary,
    marginBottom: 10,
  },
  cardTitle: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    lineHeight: 28,
    color: Colors.light.text,
    marginBottom: 10,
  },
  cardBody: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.text,
  },
  statNumber: {
    fontFamily: Fonts.heading,
    fontSize: 34,
    color: Colors.light.text,
    marginBottom: 8,
  },
  statLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
  },
});
