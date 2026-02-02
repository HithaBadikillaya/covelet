import { AuthGuard } from '@/components/auth/AuthGuard';
import { FEATURE_DESCRIPTIONS } from '@/constants/features';
import { Colors, Fonts } from '@/constants/theme';
import type { FlashbackMemory } from '@/hooks/useFlashbackMemories';
import { useFlashbackMemories } from '@/hooks/useFlashbackMemories';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FlashbackScreen() {
    const { coveId } = useLocalSearchParams<{ coveId: string }>();
    const insets = useSafeAreaInsets();
    const themeColors = Colors.light;
    const { loading, error, memories, fetchFlashbacks } = useFlashbackMemories(coveId);

    useEffect(() => {
        fetchFlashbacks();
    }, [fetchFlashbacks]);

    const sourceLabel = (m: FlashbackMemory) => {
        switch (m.source) {
            case 'quote': return 'Quote';
            case 'pin': return 'Map';
            case 'human': return 'Story';
            case 'capsule': return 'Capsule';
            default: return '';
        }
    };

    return (
        <AuthGuard>
            <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: themeColors.text }]}>On this day</Text>
                    <View style={{ width: 24 }} />
                </View>
                <Text style={[styles.description, { color: themeColors.textMuted }]}>
                    {FEATURE_DESCRIPTIONS.flashback}
                </Text>
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={themeColors.primary} />
                    </View>
                ) : error ? (
                    <View style={styles.center}>
                        <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
                        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: themeColors.primary }]} onPress={fetchFlashbacks}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : memories.length === 0 ? (
                    <View style={styles.empty}>
                        <Ionicons name="calendar-outline" size={64} color={themeColors.textMuted} />
                        <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No memories from this day</Text>
                        <Text style={[styles.emptySub, { color: themeColors.textMuted }]}>
                            Nothing from this date in past years. Check back next year!
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={memories}
                        keyExtractor={(m) => `${m.source}-${m.id}-${m.year}`}
                        contentContainerStyle={styles.list}
                        renderItem={({ item }) => (
                            <View style={[styles.card, { backgroundColor: themeColors.card }]}>
                                <View style={styles.cardHeader}>
                                    <Text style={[styles.year, { color: themeColors.primary }]}>{item.year}</Text>
                                    <Text style={[styles.source, { color: themeColors.textMuted }]}>{sourceLabel(item)}</Text>
                                </View>
                                {item.title && (
                                    <Text style={[styles.cardTitle, { color: themeColors.text }]}>{item.title}</Text>
                                )}
                                <Text style={[styles.cardContent, { color: themeColors.text }]}>{item.content}</Text>
                                {item.authorName && (
                                    <Text style={[styles.cardAuthor, { color: themeColors.textMuted }]}>— {item.authorName}</Text>
                                )}
                            </View>
                        )}
                    />
                )}
            </View>
        </AuthGuard>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
    title: { fontFamily: Fonts.heading, fontSize: 20 },
    description: { fontFamily: Fonts.body, fontSize: 14, paddingHorizontal: 20, marginBottom: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { paddingHorizontal: 20, paddingBottom: 40 },
    card: { padding: 18, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    year: { fontFamily: Fonts.bodyBold, fontSize: 14 },
    source: { fontFamily: Fonts.body, fontSize: 12 },
    cardTitle: { fontFamily: Fonts.heading, fontSize: 16, marginBottom: 6 },
    cardContent: { fontFamily: Fonts.body, fontSize: 15, lineHeight: 22 },
    cardAuthor: { fontFamily: Fonts.body, fontSize: 13, marginTop: 8 },
    errorText: { fontFamily: Fonts.body, marginBottom: 16 },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
    retryText: { fontFamily: Fonts.heading, color: '#fff' },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontFamily: Fonts.heading, fontSize: 20, marginTop: 16 },
    emptySub: { fontFamily: Fonts.body, fontSize: 14, marginTop: 8, textAlign: 'center' },
});
