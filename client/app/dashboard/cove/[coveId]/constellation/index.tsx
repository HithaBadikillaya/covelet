import FeatureInfoModal from "@/components/Dashboard/FeatureInfoModal";
import { Fonts } from "@/constants/theme";
import { useQuotes } from "@/hooks/useQuotes";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDecay,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOARD_SIZE = 2000; // Increased board size for more exploration space

const getSeededRandom = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return () => {
    hash = (hash * 9301 + 49297) % 233280;
    return Math.abs(hash / 233280);
  };
};

export default function ConstellationScreen() {
  const { coveId } = useLocalSearchParams<{ coveId: string }>();
  const insets = useSafeAreaInsets();
  const { quotes, loading, error } = useQuotes(coveId);
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);

  useEffect(() => {
    setInfoVisible(true);
  }, []);

  const starMap = React.useMemo(() => {
    const timeSorted = [...quotes].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeA - timeB;
    });

    return timeSorted.map((q) => {
      const rand = getSeededRandom(q.id);
      const x = 100 + rand() * (BOARD_SIZE - 200);
      const y = 100 + rand() * (BOARD_SIZE - 200);
      const size = 4 + rand() * 5; // Slightly larger stars
      return { ...q, x, y, size, rand };
    });
  }, [quotes]);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(-BOARD_SIZE / 4); // Start somewhat centered
  const translateY = useSharedValue(-BOARD_SIZE / 4);
  const context = useSharedValue({ x: 0, y: 0 });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(0.4, Math.min(savedScale.value * e.scale, 2.5));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value, y: translateY.value };
    })
    .onUpdate((e) => {
      translateX.value = context.value.x + e.translationX;
      translateY.value = context.value.y + e.translationY;
    })
    .onEnd((e) => {
      // Add momentum / Deceleration
      translateX.value = withDecay({
        velocity: e.velocityX,
        clamp: [-(BOARD_SIZE * scale.value) + SCREEN_WIDTH, 0],
      });
      translateY.value = withDecay({
        velocity: e.velocityY,
        clamp: [-(BOARD_SIZE * scale.value) + SCREEN_HEIGHT, 0],
      });
    });

  const combinedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (error && quotes.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>Failed to load stars.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBtn}>
          <Text style={styles.errorBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={[styles.header, { paddingTop: insets.top + 92, paddingBottom: 20 }]}>
          <View style={{ width: 44 }} />
          <Text style={styles.title}>CONSTELLATION</Text>
          <TouchableOpacity
            onPress={() => setInfoVisible(true)}
            style={styles.backBtnCircle}
          >
            <Ionicons name="information" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {loading && quotes.length === 0 ? (
          <View style={[styles.center, { flex: 1 }]}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : quotes.length === 0 ? (
          <View style={[styles.center, { flex: 1 }]}>
            <Ionicons
              name="sparkles-outline"
              size={64}
              color="rgba(255,255,255,0.2)"
            />
            <Text style={styles.emptyText}>The night sky is empty.</Text>
            <Text style={styles.emptySub}>
              Leave a message on the Wall to light a star.
            </Text>
          </View>
        ) : (
          <View style={styles.skyWrapper}>
            <GestureDetector gesture={combinedGesture}>
              <Animated.View style={[styles.sky, animatedStyle]}>
                {starMap.map((star, index) => {
                  if (index === starMap.length - 1) return null;
                  const nextStar = starMap[index + 1];

                  const dx = nextStar.x - star.x;
                  const dy = nextStar.y - star.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);

                  if (dist > 800) return null;

                  const centerX = (star.x + nextStar.x) / 2;
                  const centerY = (star.y + nextStar.y) / 2;
                  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                  return (
                    <View
                      key={`line-${star.id}`}
                      style={[
                        styles.constellationLine,
                        {
                          width: dist,
                          left: centerX - dist / 2,
                          top: centerY,
                          transform: [{ rotate: `${angle}deg` }],
                        },
                      ]}
                    />
                  );
                })}

                {starMap.map((star) => {
                  const isActive = activeQuoteId === star.id;
                  return (
                    <React.Fragment key={star.id}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() =>
                          setActiveQuoteId(isActive ? null : star.id)
                        }
                        style={[
                          styles.starHitbox,
                          { left: star.x - 20, top: star.y - 20 },
                        ]}
                      >
                        <View
                          style={[
                            styles.star,
                            {
                              width: star.size,
                              height: star.size,
                              borderRadius: star.size / 2,
                              opacity: isActive ? 1 : 0.6 + star.rand() * 0.4,
                            },
                            isActive && styles.activeStar,
                          ]}
                        />
                      </TouchableOpacity>

                      {isActive && (
                        <View
                          style={[
                            styles.tooltip,
                            {
                              left: Math.min(star.x + 10, BOARD_SIZE - 200),
                              top: star.y + 10,
                            },
                          ]}
                        >
                          <Text style={styles.tooltipAuthor}>
                            {(star.authorName || "Cove Memory").toUpperCase()}
                          </Text>
                          <Text
                            style={styles.tooltipText}
                            numberOfLines={3}
                          >{`"${star.content}"`}</Text>
                        </View>
                      )}
                    </React.Fragment>
                  );
                })}
              </Animated.View>
            </GestureDetector>
          </View>
        )}

        <FeatureInfoModal
          visible={infoVisible}
          onClose={() => setInfoVisible(false)}
          title="Constellation"
          description="A night-sky view of your Cove's memories. Each wall post becomes a star, and the stars link together over time so you can see your shared story take shape."
          howToUse={[
            "Pinch to zoom in or out and explore different parts of the sky.",
            "Tap a star to open the memory attached to it, then tap again to close it.",
            "Follow the connecting lines to trace how your Cove has grown over time.",
          ]}
          iconName="sparkles"
        />
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05070A",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(5,7,10,0.8)",
    zIndex: 10,
  },
  backBtnCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  skyWrapper: {
    flex: 1,
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  sky: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    backgroundColor: "#05070A",
  },
  constellationLine: {
    position: "absolute",
    height: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.4)", // Brighter lines
  },
  starHitbox: {
    position: "absolute",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  star: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, // Full opacity for shadow
    shadowRadius: 10, // More glow
    elevation: 8,
  },
  activeStar: {
    backgroundColor: "#FFEB3B",
    shadowColor: "#FFEB3B",
    transform: [{ scale: 2.2 }],
    shadowRadius: 15,
  },
  tooltip: {
    position: "absolute",
    width: 180,
    backgroundColor: "rgba(25, 30, 40, 0.95)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tooltipAuthor: {
    fontFamily: Fonts.heading,
    fontSize: 10,
    color: "#A0AEC0",
    letterSpacing: 1,
    marginBottom: 4,
  },
  tooltipText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: "#FFFFFF",
    lineHeight: 18,
    fontStyle: "italic",
  },
  emptyText: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: "#FFFFFF",
    marginTop: 20,
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: "#FF6B6B",
    marginVertical: 16,
  },
  errorBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
  },
  errorBtnText: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    color: "#FFFFFF",
  },
});
