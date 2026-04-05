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
    withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOARD_SIZE = 2500; 

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
      const x = 200 + rand() * (BOARD_SIZE - 400);
      const y = 200 + rand() * (BOARD_SIZE - 400);
      const size = 3 + rand() * 4; 
      return { ...q, x, y, size, randValue: rand() };
    });
  }, [quotes]);

  // Gesture shared values
  const scale = useSharedValue(0.8);
  const initialScale = useSharedValue(0.8);
  const translateX = useSharedValue(-BOARD_SIZE / 2 + SCREEN_WIDTH / 2);
  const translateY = useSharedValue(-BOARD_SIZE / 2 + SCREEN_HEIGHT / 2);
  const initialX = useSharedValue(0);
  const initialY = useSharedValue(0);

  const centerSky = () => {
    translateX.value = withSpring(-BOARD_SIZE / 2 + SCREEN_WIDTH / 2);
    translateY.value = withSpring(-BOARD_SIZE / 2 + SCREEN_HEIGHT / 2);
    scale.value = withSpring(0.8);
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      initialX.value = translateX.value;
      initialY.value = translateY.value;
    })
    .onUpdate((e) => {
      // Allow panning but keep it somewhat centered
      translateX.value = initialX.value + e.translationX;
      translateY.value = initialY.value + e.translationY;
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      initialScale.value = scale.value;
    })
    .onUpdate((e) => {
      const newScale = initialScale.value * e.scale;
      scale.value = Math.max(0.3, Math.min(newScale, 3));
    });

  const combinedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

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
        <View style={styles.overlayHeader}>
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtnCircle}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>CONSTELLATION</Text>
            <TouchableOpacity
                onPress={() => setInfoVisible(true)}
                style={styles.backBtnCircle}
            >
                <Ionicons name="information" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {loading && quotes.length === 0 ? (
          <View style={[styles.center, { flex: 1 }]}>
            <ActivityIndicator color="#FFFFFF" size="large" />
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

                  if (dist > 700) return null; // Only connect relatively close stars

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
                  const glowSize = star.size * 5;
                  
                  return (
                    <React.Fragment key={star.id}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() =>
                          setActiveQuoteId(isActive ? null : star.id)
                        }
                        style={[
                          styles.starHitbox,
                          { left: star.x - 25, top: star.y - 25 },
                        ]}
                      >
                         {/* Outer Glow */}
                         <View
                          style={[
                            styles.starGlow,
                            {
                              width: glowSize,
                              height: glowSize,
                              borderRadius: glowSize / 2,
                              backgroundColor: isActive ? 'rgba(255, 235, 59, 0.3)' : 'rgba(255, 255, 255, 0.15)',
                              opacity: 0.5 + star.randValue * 0.5,
                            },
                          ]}
                        />
                        {/* Inner Core */}
                        <View
                          style={[
                            styles.star,
                            {
                              width: star.size,
                              height: star.size,
                              borderRadius: star.size / 2,
                              backgroundColor: isActive ? '#FFEB3B' : '#FFFFFF',
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
                              left: star.x + 15,
                              top: star.y + 15,
                            },
                          ]}
                        >
                          <Text style={styles.tooltipAuthor}>
                            {(star.authorName || "Cove Memory").toUpperCase()}
                          </Text>
                          <Text
                            style={styles.tooltipText}
                            numberOfLines={4}
                          >{`"${star.content}"`}</Text>
                        </View>
                      )}
                    </React.Fragment>
                  );
                })}
              </Animated.View>
            </GestureDetector>
            
            {/* Controls */}
            <View style={styles.controls}>
                <TouchableOpacity onPress={centerSky} style={styles.controlBtn}>
                    <Ionicons name="scan" size={22} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
          </View>
        )}

        <FeatureInfoModal
          visible={infoVisible}
          onClose={() => setInfoVisible(false)}
          title="Constellation"
          description="A night-sky view of your Cove's memories. Each wall post becomes a star, and the stars link together over time so you can see your shared story take shape."
          howToUse={[
            "Pinch to zoom in or out and explore different parts of the sky.",
            "Drag your finger to pan across the starfield.",
            "Tap a star to open the memory attached to it.",
            "Use the 'center' button to find your way back if you get lost.",
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
    backgroundColor: "#020408",
  },
  overlayHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "rgba(2,4,8,0.7)",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  backBtnCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    color: "#FFFFFF",
    letterSpacing: 4,
    textAlign: 'center',
  },
  skyWrapper: {
    flex: 1,
    overflow: "hidden",
  },
  sky: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    backgroundColor: "#020408",
  },
  constellationLine: {
    position: "absolute",
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)", 
  },
  starHitbox: {
    position: "absolute",
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  starGlow: {
    position: "absolute",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  star: {
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
  },
  activeStar: {
    transform: [{ scale: 1.8 }],
    shadowColor: "#FFEB3B",
    shadowRadius: 8,
  },
  tooltip: {
    position: "absolute",
    width: 200,
    backgroundColor: "rgba(10, 15, 25, 0.98)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    zIndex: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  tooltipAuthor: {
    fontFamily: Fonts.heading,
    fontSize: 10,
    color: "#8899AA",
    letterSpacing: 2,
    marginBottom: 6,
  },
  tooltipText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: "#E2E8F0",
    lineHeight: 20,
    fontStyle: "italic",
  },
  controls: {
      position: 'absolute',
      bottom: 40,
      right: 20,
      flexDirection: 'column',
      gap: 12,
  },
  controlBtn: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: "rgba(255,255,255,0.1)",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
      backdropFilter: 'blur(10px)',
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
