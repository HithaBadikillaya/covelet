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
    const { loading, error, memories, fetchFlashbacks } = useFlashbackMemories(coveId);

    useEffect(() => {
        fetchFlashbacks();
    }, [fetchFlashbacks]);

    const sourceLabel = (m: FlashbackMemory) => {
        switch (m.source) {
            case 'quote': return 'Quote';
            case 'pin': return 'Mood Board';
            case 'human': return 'Story';
            case 'capsule': return 'Capsule';
            default: return '';
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors.light.background }]}> 
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}> 
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtnCircle}>
                    <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <Text style={styles.title}>On this day</Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.introSection}>
                <Text style={styles.description}>{FEATURE_DESCRIPTIONS.flashback}</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                </View>
            ) : error && memories.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="alert-circle-outline" size={48} color={Colors.light.error} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={[styles.retryBtn, { backgroundColor: Colors.light.primary }]} onPress={fetchFlashbacks}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : memories.length === 0 ? (
                <View style={styles.empty}>
                    <View style={styles.emptyIllustration}>
                        <Ionicons name="calendar-outline" size={48} color={Colors.light.border} />
                    </View>
                    <Text style={styles.emptyTitle}>Quiet on this day</Text>
                    <Text style={styles.emptySub}>Nothing from this date in past years. Check back next year!</Text>
                </View>
            ) : (
                <FlatList
                    data={memories}
                    keyExtractor={(m) => `${m.source}-${m.id}-${m.year}`}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        error ? (
                            <View style={styles.partialErrorBox}>
                                <Ionicons name="alert-circle-outline" size={16} color={Colors.light.warning} />
                                <Text style={styles.partialErrorText}>{error}</Text>
                            </View>
                        ) : null
                    }
                    renderItem={({ item, index }) => (
                        <View style={[styles.card, { transform: [{ rotate: index % 2 === 0 ? '1deg' : '-1deg' }] }]}> 
                            <View style={styles.tape} />
                            <View style={styles.cardHeader}>
                                <View style={styles.yearBadge}>
                                    <Text style={styles.yearText}>{item.year}</Text>
                                </View>
                                <View style={styles.sourceBadge}>
                                    <Text style={styles.sourceText}>{sourceLabel(item)}</Text>
                                </View>
                            </View>
                            {item.title ? <Text style={styles.cardTitle}>{item.title}</Text> : null}
                            <Text style={styles.cardContent}>{item.content}</Text>
                            {item.authorName ? (
                                <View style={styles.footer}>
                                    <View style={styles.dot} />
                                    <Text style={styles.cardAuthor}>From {item.authorName}</Text>
                                </View>
                            ) : null}
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backBtnCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 24,
        color: Colors.light.text,
    },
    introSection: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    description: {
        fontFamily: Fonts.body,
        fontSize: 15,
        color: Colors.light.text,
        lineHeight: 22,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { paddingHorizontal: 20, paddingBottom: 60, paddingTop: 12 },
    partialErrorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FEFCE8',
        borderWidth: 1,
        borderColor: '#FDE68A',
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 16,
    },
    partialErrorText: {
        flex: 1,
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.light.warning,
        lineHeight: 18,
    },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 4,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1EFE9',
        shadowColor: '#2F2E2C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        position: 'relative',
    },
    tape: {
        position: 'absolute',
        top: -10,
        alignSelf: 'center',
        width: 70,
        height: 20,
        backgroundColor: '#4A6741',
        opacity: 0.2,
        transform: [{ rotate: '-2deg' }],
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    yearBadge: {
        backgroundColor: Colors.light.primary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
    },
    yearText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        color: '#FFFFFF',
    },
    sourceBadge: {
        backgroundColor: '#F9F7F2',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    sourceText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 11,
        color: Colors.light.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardTitle: {
        fontFamily: Fonts.heading,
        fontSize: 18,
        color: Colors.light.text,
        marginBottom: 8,
    },
    cardContent: {
        fontFamily: Fonts.body,
        fontSize: 16,
        lineHeight: 24,
        color: Colors.light.text,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#FDFBF7',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.light.primary,
        opacity: 0.3,
    },
    cardAuthor: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 13,
        color: Colors.light.textMuted,
    },
    errorText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.light.error,
        marginTop: 16,
        marginBottom: 24,
    },
    retryBtn: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
    },
    retryText: {
        fontFamily: Fonts.heading,
        fontSize: 16,
        color: '#FFFFFF',
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        marginBottom: 80,
    },
    emptyIllustration: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderStyle: 'dashed',
    },
    emptyTitle: {
        fontFamily: Fonts.heading,
        fontSize: 22,
        color: Colors.light.text,
        marginBottom: 8,
    },
    emptySub: {
        fontFamily: Fonts.body,
        fontSize: 15,
        color: Colors.light.textMuted,
        textAlign: 'center',
        lineHeight: 22,
    },
});