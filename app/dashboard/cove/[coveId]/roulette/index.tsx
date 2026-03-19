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

const MEMORY_TYPE_LABELS = {
    quote: 'Wall Quote',
    pin: 'Mood Board Note',
    human: 'Humans of the Cove',
    capsule: 'Time Capsule Entry',
} as const;

export default function RouletteScreen() {
    const { coveId } = useLocalSearchParams<{ coveId: string }>();
    const insets = useSafeAreaInsets();
    const { loading, error, memory, spin } = useMemoryRoulette(coveId);

    return (
        <View style={[styles.container, { backgroundColor: Colors.light.background }]}> 
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}> 
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtnCircle}>
                    <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Memory Roulette</Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.introSection}>
                <Text style={styles.description}>{FEATURE_DESCRIPTIONS.roulette}</Text>
            </View>

            <View style={styles.content}>
                {error && !memory ? (
                    <View style={styles.errorBox}>
                        <Ionicons name="alert-circle-outline" size={20} color={Colors.light.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {loading ? (
                    <View style={styles.spinArea}>
                        <View style={styles.diceContainer}>
                            <ActivityIndicator size="large" color={Colors.light.primary} />
                        </View>
                        <Text style={styles.spinLabel}>Shuffling the scrapbook...</Text>
                    </View>
                ) : memory ? (
                    <View style={styles.memoryContainer}>
                        <View style={[styles.memoryCard, { transform: [{ rotate: '-1deg' }] }]}> 
                            <View style={styles.tape} />

                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{MEMORY_TYPE_LABELS[memory.type]}</Text>
                            </View>

                            {memory.title ? <Text style={styles.memoryTitle}>{memory.title}</Text> : null}
                            <Text style={styles.memoryContent}>{memory.content}</Text>

                            {memory.authorName ? (
                                <View style={styles.authorRow}>
                                    <View style={styles.dot} />
                                    <Text style={styles.memoryAuthor}>From {memory.authorName}</Text>
                                </View>
                            ) : null}
                        </View>
                        <Text style={styles.hint}>Found a memory!</Text>
                    </View>
                ) : (
                    <View style={styles.emptyArea}>
                        <View style={styles.dicePlaceholder}>
                            <Ionicons name="dice-outline" size={64} color={Colors.light.border} />
                        </View>
                        <Text style={styles.hint}>Tap the button below to draw a memory at random.</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.spinBtn, { backgroundColor: Colors.light.primary }]}
                    onPress={spin}
                    disabled={loading}
                    activeOpacity={0.9}
                >
                    <Ionicons name="dice" size={24} color="#FFFFFF" />
                    <Text style={styles.spinBtnText}>Spin the Wheel</Text>
                </TouchableOpacity>
            </View>
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
        marginBottom: 24,
    },
    description: {
        fontFamily: Fonts.body,
        fontSize: 15,
        color: Colors.light.text,
        lineHeight: 22,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        paddingBottom: 40,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    errorText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.light.error,
    },
    spinArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    diceContainer: {
        width: 100,
        height: 100,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.light.border,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    spinLabel: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: Colors.light.textMuted,
    },
    memoryContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    memoryCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        padding: 32,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#F1EFE9',
        shadowColor: '#2F2E2C',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 10,
        position: 'relative',
    },
    tape: {
        position: 'absolute',
        top: -12,
        alignSelf: 'center',
        width: 80,
        height: 24,
        backgroundColor: '#4A6741',
        opacity: 0.2,
        transform: [{ rotate: '3deg' }],
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F9F7F2',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        marginBottom: 20,
    },
    badgeText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        color: Colors.light.primary,
        letterSpacing: 0.5,
    },
    memoryTitle: {
        fontFamily: Fonts.heading,
        fontSize: 22,
        color: Colors.light.text,
        marginBottom: 12,
    },
    memoryContent: {
        fontFamily: Fonts.body,
        fontSize: 17,
        lineHeight: 26,
        color: Colors.light.text,
        marginBottom: 24,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#FDFBF7',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.light.primary,
        opacity: 0.4,
    },
    memoryAuthor: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: Colors.light.textMuted,
    },
    emptyArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dicePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderStyle: 'dashed',
        marginBottom: 24,
    },
    hint: {
        fontFamily: Fonts.body,
        fontSize: 15,
        color: Colors.light.textMuted,
        textAlign: 'center',
        paddingHorizontal: 40,
        marginTop: 20,
    },
    spinBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        height: 64,
        borderRadius: 32,
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    spinBtnText: {
        fontFamily: Fonts.heading,
        fontSize: 18,
        color: '#FFFFFF',
    },
});