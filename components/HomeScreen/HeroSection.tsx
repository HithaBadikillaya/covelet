import { Colors, Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const HeroSection = () => {
    const themeColors = Colors.light;

    const handleGetStarted = () => {
        router.push('/login');
    };

    const handleDashboard = () => {
        router.push('/(tabs)/dashboard');
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.badgeContainer}>
                    <View style={[styles.badgeLine, { backgroundColor: themeColors.primary }]} />
                    <Text style={[styles.badgeText, { color: themeColors.primary }]}>EST. 2026</Text>
                </View>

                <Text style={[styles.title, { color: themeColors.text }]}>
                    Your digital{"\n"}sanctuary.
                </Text>

                <Text style={[styles.missionStatement, { color: themeColors.text }]}>
                    A minimalist space for what matters most. No noise, no tracking, just clarity for your digital life.
                </Text>

                <View style={styles.funDetails}>
                    <View style={styles.detailItem}>
                        <Ionicons name="shield-checkmark-outline" size={20} color={themeColors.primary} />
                        <Text style={[styles.detailText, { color: themeColors.text }]}>Privacy by design</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="leaf-outline" size={20} color={themeColors.primary} />
                        <Text style={[styles.detailText, { color: themeColors.text }]}>Breathable UI</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="infinite-outline" size={20} color={themeColors.primary} />
                        <Text style={[styles.detailText, { color: themeColors.text }]}>Permanent memories</Text>
                    </View>
                </View>

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
                        onPress={handleDashboard}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.secondaryButtonText, { color: themeColors.primary }]}>Go to Dashboard</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footerNote}>
                    <Text style={[styles.footerNoteText, { color: themeColors.textMuted }]}>
                        Crafted for the minimalist. Built for the future.
                    </Text>
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
        marginBottom: 32,
    },
    funDetails: {
        width: '100%',
        marginBottom: 40,
        gap: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    detailText: {
        fontFamily: Fonts.body,
        fontSize: 16,
        opacity: 0.9,
    },
    ctaContainer: {
        width: '100%',
        gap: 16,
        marginBottom: 40,
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
    footerNote: {
        width: '100%',
        alignItems: 'center',
        marginTop: 20,
    },
    footerNoteText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        fontStyle: 'italic',
    },
});
