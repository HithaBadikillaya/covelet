import { AuthGuard } from "@/components/auth/AuthGuard";
import { subscribeToAuthChanges } from "@/components/auth/authService";
import { NAVBAR_HEIGHT } from "@/components/Navbar";
import { Colors, Fonts } from "@/constants/theme";
import { db } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { User } from "firebase/auth";
import { deleteDoc, doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Cove {
  id: string;
  name: string;
  description?: string;
  members: string[];
  createdBy: string;
  joinCode: string;
  createdAt?: { seconds: number };
}

export default function CoveDetailsScreen() {
  const { coveId } = useLocalSearchParams<{ coveId: string }>();
  const insets = useSafeAreaInsets();
  const themeColors = Colors.light;

  const [cove, setCove] = useState<Cove | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- AUTH SUBSCRIPTION ---------------- */
  useEffect(() => {
    const unsubAuth = subscribeToAuthChanges(setUser);
    return () => unsubAuth();
  }, []);

  /* ---------------- COVE SNAPSHOT ---------------- */
  useEffect(() => {
    if (!user || !coveId) return;

    const coveRef = doc(db, "coves", coveId);

    const unsubscribe = onSnapshot(
      coveRef,
      (snap) => {
        if (!snap.exists()) {
          router.replace("/(tabs)/dashboard");
          return;
        }

        const data = { id: snap.id, ...snap.data() } as Cove;

        if (!data.members.includes(user.uid)) {
          router.replace("/(tabs)/dashboard");
          return;
        }

        setCove(data);
        setLoading(false);
      },
      () => {
        router.replace("/(tabs)/dashboard");
      },
    );

    return () => unsubscribe();
  }, [user, coveId]);

  /* ---------------- DELETE HANDLER ---------------- */
  const handleDelete = () => {
    if (!cove || !user || cove.createdBy !== user.uid) return;

    Alert.alert(
      "Delete Cove",
      "This action is permanent and cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              setCove(null);

              await deleteDoc(doc(db, "coves", cove.id));

              router.replace("/(tabs)/dashboard");
            } catch (err: any) {
              console.error("Error deleting cove:", err);
              if (err.code === "permission-denied") {
                Alert.alert(
                  "Permission Denied",
                  "Only the creator of this Cove can delete it.",
                );
              } else {
                Alert.alert("Error", "Failed to delete Cove.");
              }
            }
          },
        },
      ],
    );
  };

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <View
        style={[styles.loading, { backgroundColor: themeColors.background }]}
      >
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  if (!cove || !user) return null;

  const isOwner = cove.createdBy === user.uid;
  const createdDate = cove.createdAt
    ? new Date(cove.createdAt.seconds * 1000).toDateString()
    : "—";

  /* ---------------- NAVIGATION HANDLERS ---------------- */
  const navigateToFeature = (path: string) => {
    router.push(`/dashboard/cove/${coveId}/${path}`);
  };

  const navigateToSettings = () => {
    if (!isOwner) return;
    router.push(`/dashboard/cove/${coveId}/settings`);
  };

  return (
    <AuthGuard>
      <View
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + NAVBAR_HEIGHT + 24,
            paddingHorizontal: 24,
            paddingBottom: 40,
          }}
        >
          {/* HEADER */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)/dashboard")}
            >
              <Ionicons name="arrow-back" size={24} color={themeColors.text} />
            </TouchableOpacity>
            {isOwner && (
              <TouchableOpacity onPress={navigateToSettings}>
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={themeColors.text}
                />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.title, { color: themeColors.text }]}>
            {cove.name}
          </Text>

          <Text style={[styles.description, { color: themeColors.textMuted }]}>
            {cove.description || "A digital sanctuary."}
          </Text>

          {/* FEATURES SECTION */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>
              MEMORIES
            </Text>

            <View style={styles.featureList}>
              <TouchableOpacity
                style={styles.featureRow}
                onPress={() => navigateToFeature("time-capsule")}
                activeOpacity={0.6}
              >
                <View>
                  <Text style={[styles.featureName, { color: themeColors.text }]}>
                    Time Capsule
                  </Text>
                  <Text style={[styles.featureHint, { color: themeColors.textMuted }]}>
                    Messages for the future
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={themeColors.textMuted}
                />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

              <TouchableOpacity
                style={styles.featureRow}
                onPress={() => navigateToFeature("humans")}
                activeOpacity={0.6}
              >
                <View>
                  <Text style={[styles.featureName, { color: themeColors.text }]}>
                    Humans
                  </Text>
                  <Text style={[styles.featureHint, { color: themeColors.textMuted }]}>
                    Member stories and moments
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={themeColors.textMuted}
                />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

              <TouchableOpacity
                style={styles.featureRow}
                onPress={() => navigateToFeature("wall")}
                activeOpacity={0.6}
              >
                <View>
                  <Text style={[styles.featureName, { color: themeColors.text }]}>
                    The Wall
                  </Text>
                  <Text style={[styles.featureHint, { color: themeColors.textMuted }]}>
                    Shared thoughts and quotes
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={themeColors.textMuted}
                />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

              <TouchableOpacity
                style={styles.featureRow}
                onPress={() => navigateToFeature("map")}
                activeOpacity={0.6}
              >
                <View>
                  <Text style={[styles.featureName, { color: themeColors.text }]}>
                    Memory Map
                  </Text>
                  <Text style={[styles.featureHint, { color: themeColors.textMuted }]}>
                    Places and their stories
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={themeColors.textMuted}
                />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

              <TouchableOpacity
                style={styles.featureRow}
                onPress={() => navigateToFeature("roulette")}
                activeOpacity={0.6}
              >
                <View>
                  <Text style={[styles.featureName, { color: themeColors.text }]}>
                    Roulette
                  </Text>
                  <Text style={[styles.featureHint, { color: themeColors.textMuted }]}>
                    Discover random memories
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={themeColors.textMuted}
                />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

              <TouchableOpacity
                style={styles.featureRow}
                onPress={() => navigateToFeature("flashback")}
                activeOpacity={0.6}
              >
                <View>
                  <Text style={[styles.featureName, { color: themeColors.text }]}>
                    On this day
                  </Text>
                  <Text style={[styles.featureHint, { color: themeColors.textMuted }]}>
                    Memories from past years
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={themeColors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>


          {/* QUICK INFO (Temporary until Settings is robust) */}
          <View style={styles.infoSection}>
            <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>
              ABOUT
            </Text>
            <View style={styles.infoBox}>
              <View style={styles.infoPair}>
                <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>
                  Created
                </Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]}>
                  {createdDate}
                </Text>
              </View>
              <View style={[styles.infoDivider, { backgroundColor: themeColors.border }]} />
              <View style={styles.infoPair}>
                <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>
                  Members
                </Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]}>
                  {cove.members.length}
                </Text>
              </View>
              {isOwner && (
                <>
                  <View style={[styles.infoDivider, { backgroundColor: themeColors.border }]} />
                  <View style={styles.infoPair}>
                    <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>
                      Join Code
                    </Text>
                    <Text style={[styles.infoValue, { color: themeColors.text }]}>
                      {cove.joinCode}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </AuthGuard>
  );
}
/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 40,
    opacity: 0.6,
  },
  section: {
    marginBottom: 48,
  },
  sectionTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 16,
    opacity: 0.6,
  },
  featureList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
  },
  featureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    activeOpacity: 0.5,
  },
  featureName: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  featureHint: {
    fontFamily: Fonts.body,
    fontSize: 14,
    opacity: 0.7,
  },
  divider: {
    height: 0.5,
    marginHorizontal: 20,
    opacity: 0.3,
  },
  infoSection: {
    marginTop: 24,
  },
  infoBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    paddingVertical: 4,
  },
  infoPair: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  infoLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    opacity: 0.6,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    fontWeight: "500",
  },
  infoDivider: {
    height: 0.5,
    marginHorizontal: 20,
    opacity: 0.2,
  },
});
