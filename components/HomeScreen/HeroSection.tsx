import { Colors, Fonts } from '@/constants/theme';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const HeroSection = () => {
    const themeColors = Colors.light;

    const handleGetStarted = () => {
        router.push('/login');
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.badgeContainer}>
                    <View style={[styles.badgeLine, { backgroundColor: themeColors.primary }]} />
                    <Text style={[styles.badgeText, { color: themeColors.primary }]}>EST. 2026</Text>
                </View>

                <Text style={[styles.title, { color: themeColors.text }]}>
                    A safe harbor for your digital life.
                </Text>

                <Text style={[styles.missionStatement, { color: themeColors.text }]}>
                    Covelet is a sanctuary for your digital life. Securely store, share, and protect what matters most—without tracking or clutter.
                </Text>

                <View style={styles.ctaContainer}>
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: themeColors.primary }]}
                        onPress={handleGetStarted}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.primaryButtonText, { color: themeColors.background }]}>Get Started</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.secondaryButton, { borderColor: themeColors.primary }]}
                        onPress={() => router.push('/login')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.secondaryButtonText, { color: themeColors.primary }]}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
    },
    content: {
        alignItems: 'flex-start',
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
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
        fontSize: 48,
        lineHeight: 54,
        textAlign: 'left',
        marginBottom: 24,
    },
    missionStatement: {
        fontFamily: Fonts.body,
        fontSize: 18,
        lineHeight: 28,
        textAlign: 'left',
        opacity: 0.8,
        marginBottom: 40,
    },
    ctaContainer: {
        width: '100%',
        gap: 16,
    },
    primaryButton: {
        width: '100%',
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButtonText: {
        fontFamily: Fonts.heading,
        fontSize: 16,
    },
    secondaryButton: {
        width: '100%',
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    secondaryButtonText: {
        fontFamily: Fonts.heading,
        fontSize: 16,
    },
});
