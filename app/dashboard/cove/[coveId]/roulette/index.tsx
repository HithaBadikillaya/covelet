import { AuthGuard } from '@/components/auth/AuthGuard';
import { FEATURE_DESCRIPTIONS } from '@/constants/features';
import { Colors, Fonts } from '@/constants/theme';
import { useMemoryRoulette } from '@/hooks/useMemoryRoulette';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RouletteScreen() {
    const { coveId } = useLocalSearchParams<{ coveId: string }>();
    const insets = useSafeAreaInsets();
    const themeColors = Colors.light; // Dark theme background already set in Colors.light.background
    const { loading, error, memory, spin } = useMemoryRoulette(coveId);

    return (
        <AuthGuard>
            <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                {/* HEADER */}
                <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: themeColors.text }]}>Memory Roulette</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* SCROLLABLE CONTENT */}
                <ScrollView
                    contentContainerStyle={[
                        styles.content,
                        { paddingTop: 20, paddingBottom: insets.bottom + 30 },
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={[styles.description, { color: themeColors.textMuted }]}>
                        {FEATURE_DESCRIPTIONS.roulette}
                    </Text>

                    {/* ERROR */}
                    {error && !memory && (
                        <View style={styles.errorBox}>
                            <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
                        </View>
                    )}

                    {/* LOADING */}
                    {loading && (
                        <View style={styles.spinArea}>
                            <ActivityIndicator size="large" color="#D4A373" />
                            <Text style={[styles.spinLabel, { color: themeColors.textMuted }]}>Spinning...</Text>
                        </View>
                    )}

                    {/* MEMORY CARD */}
                    {!loading && memory && (
                        <View style={[styles.memoryCard, { backgroundColor: '#1F1F1F', shadowColor: '#000' }]}>
                            <View style={styles.badge}>
                                <Text style={[styles.badgeText, { color: '#D4A373' }]}>
                                    {memory.type === 'quote' && 'Quote'}
                                    {memory.type === 'pin' && 'Map memory'}
                                    {memory.type === 'human' && 'Human story'}
                                    {memory.type === 'capsule' && 'Time capsule'}
                                </Text>
                            </View>

                            {memory.title && (
                                <Text style={[styles.memoryTitle, { color: themeColors.text }]}>
                                    {memory.title}
                                </Text>
                            )}
                            <Text style={[styles.memoryContent, { color: themeColors.text }]}>
                                {memory.content}
                            </Text>
                            {memory.authorName && (
                                <Text style={[styles.memoryAuthor, { color: themeColors.textMuted }]}>
                                    — {memory.authorName}
                                </Text>
                            )}
                        </View>
                    )}

                    {/* HINT */}
                    {!loading && !memory && !error && (
                        <Text style={[styles.hint, { color: themeColors.textMuted }]}>
                            Tap Spin to see a random memory.
                        </Text>
                    )}

                    {/* SPIN BUTTON */}
                    <TouchableOpacity
                        style={styles.spinBtn}
                        onPress={spin}
                        disabled={loading}
                    >
                        <Ionicons name="dice-outline" size={28} color="#fff" />
                        <Text style={styles.spinBtnText}>Spin</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </AuthGuard>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        backgroundColor: Colors.light.background,
        zIndex: 10,
    },
    title: { fontFamily: Fonts.heading, fontSize: 22 },
    description: {
        fontFamily: Fonts.body,
        fontSize: 15,
        marginBottom: 24,
        lineHeight: 22,
        color: '#ccc',
    },
    content: { paddingHorizontal: 20 },
    errorBox: {
        padding: 16,
        marginBottom: 16,
        borderRadius: 14,
        backgroundColor: 'rgba(239,68,68,0.15)',
    },
    errorText: { fontFamily: Fonts.body, fontSize: 14 },
    spinArea: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
    spinLabel: { fontFamily: Fonts.body, fontSize: 14, marginTop: 10 },
    memoryCard: {
        padding: 24,
        borderRadius: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    badge: { alignSelf: 'flex-start', marginBottom: 10 },
    badgeText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    memoryTitle: { fontFamily: Fonts.heading, fontSize: 19, marginBottom: 8 },
    memoryContent: { fontFamily: Fonts.body, fontSize: 16, lineHeight: 24, marginBottom: 12 },
    memoryAuthor: { fontFamily: Fonts.body, fontSize: 14, fontStyle: 'italic', color: '#aaa' },
    hint: { fontFamily: Fonts.body, fontSize: 14, marginBottom: 24 },
    spinBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 56,
        borderRadius: 28,
        alignSelf: 'center',
        paddingHorizontal: 32,
        marginBottom: 40,
        backgroundColor: '#D4A373', // Beige/Caramel color
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 6,
    },
    spinBtnText: { fontFamily: Fonts.heading, fontSize: 18, color: '#fff' },
});
