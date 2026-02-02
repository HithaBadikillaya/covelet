import { AuthGuard } from '@/components/auth/AuthGuard';
import { FEATURE_DESCRIPTIONS } from '@/constants/features';
import { Colors, Fonts } from '@/constants/theme';
import { useMemoryRoulette } from '@/hooks/useMemoryRoulette';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RouletteScreen() {
    const { coveId } = useLocalSearchParams<{ coveId: string }>();
    const insets = useSafeAreaInsets();
    const themeColors = Colors.light;
    const { loading, error, memory, spin } = useMemoryRoulette(coveId);

    return (
        <AuthGuard>
            <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: themeColors.text }]}>Memory Roulette</Text>
                    <View style={{ width: 24 }} />
                </View>
                <Text style={[styles.description, { color: themeColors.textMuted }]}>
                    {FEATURE_DESCRIPTIONS.roulette}
                </Text>
                <View style={styles.content}>
                    {error && !memory && (
                        <View style={styles.errorBox}>
                            <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
                        </View>
                    )}
                    {loading && (
                        <View style={styles.spinArea}>
                            <ActivityIndicator size="large" color={themeColors.primary} />
                            <Text style={[styles.spinLabel, { color: themeColors.textMuted }]}>Spinning...</Text>
                        </View>
                    )}
                    {!loading && memory && (
                        <View style={[styles.memoryCard, { backgroundColor: themeColors.card }]}>
                            <View style={styles.badge}>
                                <Text style={[styles.badgeText, { color: themeColors.primary }]}>
                                    {memory.type === 'quote' && 'Quote'}
                                    {memory.type === 'pin' && 'Map memory'}
                                    {memory.type === 'human' && 'Human story'}
                                    {memory.type === 'capsule' && 'Time capsule'}
                                </Text>
                            </View>
                            {memory.title && (
                                <Text style={[styles.memoryTitle, { color: themeColors.text }]}>{memory.title}</Text>
                            )}
                            <Text style={[styles.memoryContent, { color: themeColors.text }]}>{memory.content}</Text>
                            {memory.authorName && (
                                <Text style={[styles.memoryAuthor, { color: themeColors.textMuted }]}>— {memory.authorName}</Text>
                            )}
                        </View>
                    )}
                    {!loading && !memory && !error && (
                        <Text style={[styles.hint, { color: themeColors.textMuted }]}>Tap Spin to see a random memory.</Text>
                    )}
                    <TouchableOpacity
                        style={[styles.spinBtn, { backgroundColor: themeColors.primary }]}
                        onPress={spin}
                        disabled={loading}
                    >
                        <Ionicons name="dice-outline" size={28} color="#fff" />
                        <Text style={styles.spinBtnText}>Spin</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </AuthGuard>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
    title: { fontFamily: Fonts.heading, fontSize: 20 },
    description: { fontFamily: Fonts.body, fontSize: 14, paddingHorizontal: 20, marginBottom: 24 },
    content: { flex: 1, paddingHorizontal: 20 },
    errorBox: { padding: 16, marginBottom: 16, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.15)' },
    errorText: { fontFamily: Fonts.body, fontSize: 14 },
    spinArea: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
    spinLabel: { fontFamily: Fonts.body, fontSize: 14, marginTop: 12 },
    memoryCard: { padding: 24, borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    badge: { alignSelf: 'flex-start', marginBottom: 12 },
    badgeText: { fontFamily: Fonts.bodyBold, fontSize: 12 },
    memoryTitle: { fontFamily: Fonts.heading, fontSize: 18, marginBottom: 8 },
    memoryContent: { fontFamily: Fonts.body, fontSize: 16, lineHeight: 24, marginBottom: 12 },
    memoryAuthor: { fontFamily: Fonts.body, fontSize: 14 },
    hint: { fontFamily: Fonts.body, fontSize: 14, marginBottom: 24 },
    spinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 28, alignSelf: 'center', paddingHorizontal: 32 },
    spinBtnText: { fontFamily: Fonts.heading, fontSize: 18, color: '#fff' },
});
