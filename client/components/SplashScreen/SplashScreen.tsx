import { Colors, Fonts } from "@/constants/theme";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, View, Image } from "react-native";

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

const { width } = Dimensions.get("window");

/**
 * Custom Animated SplashScreen
 * Provides a futuristic, premium 'Digital Vault' intro for Covelet.
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({
  onAnimationComplete,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Entrance: Fade and subtle scale up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Continuous Pulse loop for a 'living' organic feel
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Exit: Fade out after branding is established
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(onAnimationComplete);
    }, 2800);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, pulseAnim, onAnimationComplete]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { scale: pulseAnim }
            ],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.logoLabel}>COVELET</Text>
          <View style={styles.divider} />
          <Text style={styles.tagline}>YOUR PIECES. OUR VAULT.</Text>
        </View>
      </Animated.View>

      {/* Minimalism: A very thin, elegant loading indicator */}
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <View style={styles.loadingTrack}>
           <Animated.View style={[styles.loadingFill, {
             width: '100%',
             transform: [{
               translateX: fadeAnim.interpolate({
                 inputRange: [0, 1],
                 outputRange: [-width * 0.4, 0]
               })
             }]
           }]} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.light.background,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    width: width * 0.45,
    height: width * 0.45,
    marginBottom: 24,
    // Note: React Native doesn't support complex glows easily, 
    // but centering the logo on a warm cream background feels premium.
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: "center",
  },
  logoLabel: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    color: Colors.light.primary,
    letterSpacing: 10,
    marginLeft: 10, // Compensation for letter spacing
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: Colors.light.secondary,
    marginVertical: 12,
    opacity: 0.6,
  },
  tagline: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.light.textMuted,
    letterSpacing: 2,
    opacity: 0.8,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    width: '100%',
  },
  loadingTrack: {
    width: width * 0.4,
    height: 1,
    backgroundColor: Colors.light.border,
    overflow: 'hidden',
  },
  loadingFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
  },
});
