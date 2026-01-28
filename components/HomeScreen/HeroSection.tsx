import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export const HeroSection = () => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const themeColors = Colors[isDark ? 'dark' : 'light'];

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[
                styles.content,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}>
                <View style={styles.badgeContainer}>
                    <View style={[styles.badgeLine, { backgroundColor: themeColors.ocean }]} />
                    <Text style={[styles.badgeText, { color: themeColors.ocean }]}>EST. 2026</Text>
                </View>

                <Text style={[styles.title, { color: themeColors.text }]}>
                    A safe harbor for your digital life.
                </Text>

                <View style={[styles.divider, { backgroundColor: themeColors.sand }]} />

                <Text style={[styles.missionStatement, { color: themeColors.text }]}>
                    Covelet is a sanctuary for your digital life, built for everyday people who value clarity over complexity and privacy over noise. In a world that often feels fast and fragile, we’ve created a calm space where you can securely store, share, and protect what matters most to you—without the hype, without the tracking, and without the clutter.
                </Text>

                <Text style={[styles.missionStatement, { color: themeColors.text, marginTop: 16 }]}>
                    Whether you're preserving personal memories or collaborating with your inner circle, Covelet treats your information with the respect it deserves, providing a safe harbor in the digital storm.
                </Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 60,
        paddingHorizontal: 24,
    },
    content: {
        alignItems: 'flex-start',
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    badgeLine: {
        width: 32,
        height: 2,
        marginRight: 10,
    },
    badgeText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        letterSpacing: 2,
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 42,
        lineHeight: 48,
        textAlign: 'left',
        marginBottom: 24,
    },
    divider: {
        width: 60,
        height: 4,
        marginBottom: 32,
    },
    missionStatement: {
        fontFamily: Fonts.body,
        fontSize: 18,
        lineHeight: 28,
        textAlign: 'left',
        opacity: 0.9,
    },
});
