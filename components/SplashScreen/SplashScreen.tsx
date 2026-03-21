import { Colors, Fonts } from "@/constants/theme";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

const { width } = Dimensions.get("window");

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onAnimationComplete,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('SplashScreen: Mounting and starting animation');
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.delay(1200), // stays visible
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      console.log('SplashScreen: Animation complete - calling callback');
      onAnimationComplete();
    });
  }, [fadeAnim, onAnimationComplete]);

  return (
    <View style={styles.container}>
      {/* green blob */}
      <View style={styles.blob} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.logoLabel}>COVELET</Text>
        <Text style={styles.tagline}>your memories, but better</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E6F0E3",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    width: width * 0.9,
    height: width * 0.9,
    backgroundColor: "#DCE8D5",
    borderRadius: 200,
    transform: [{ rotate: "25deg" }],
    opacity: 0.6,
  },
  content: {
    alignItems: "center",
  },
  logoLabel: {
    fontFamily: Fonts.heading,
    fontSize: width * 0.1,
    color: Colors.light.text,
    letterSpacing: 4,
  },
  tagline: {
    marginTop: 8,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.light.text,
    opacity: 0.7,
  },
});
