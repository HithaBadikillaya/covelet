import { CreateQuoteModal } from '@/components/Wall/CreateQuoteModal';
import { QuoteCard } from '@/components/Wall/QuoteCard';
import { FEATURE_DESCRIPTIONS } from '@/constants/features';
import { Colors, Fonts } from '@/constants/theme';
import { useQuotes } from '@/hooks/useQuotes';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WallScreen() {
    const { coveId } = useLocalSearchParams<{ coveId: string }>();
    const insets = useSafeAreaInsets();
    const [modalVisible, setModalVisible] = useState(false);

    const {
        quotes,
        loading,
        error,
        sort,
        setSort,
        createQuote,
        deleteQuote,
        toggleUpvote,
        hasUpvoted,
        subscribeReplies,
        addReply,
    } = useQuotes(coveId);

    const handleCreate = async (content: string) => {
        await createQuote(content);
    };

    const subscribeRepliesStable = useCallback(
        (quoteId: string, onReplies: (r: import('@/hooks/useQuotes').QuoteReply[]) => void) =>
            subscribeReplies(quoteId, onReplies),
        [subscribeReplies]
    );

    if (error && quotes.length === 0) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: Colors.light.background }]}> 
                <Ionicons name="alert-circle-outline" size={48} color={Colors.light.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.errorBackBtn} onPress={() => router.back()}>
                    <Text style={styles.errorBackBtnText}>GO BACK</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: Colors.light.background }]}> 
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}> 
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtnSquare}>
                    <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <Text style={styles.title}>THE WALL</Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.introSection}>
                <Text style={styles.description}>{FEATURE_DESCRIPTIONS.wall}</Text>
                <Text style={styles.subDescription}>
                    Start a thread, reply to each other, and keep the moments that matter easy to revisit.
                </Text>
            </View>

            <View style={styles.sortRow}>
                <TouchableOpacity style={[styles.sortBtn, sort === 'recent' && styles.sortBtnActive]} onPress={() => setSort('recent')}>
                    <Text style={[styles.sortText, sort === 'recent' && styles.sortTextActive]}>RECENT</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sortBtn, sort === 'upvoted' && styles.sortBtnActive]} onPress={() => setSort('upvoted')}>
                    <Text style={[styles.sortText, sort === 'upvoted' && styles.sortTextActive]}>MOST LOVED</Text>
                </TouchableOpacity>
            </View>

            {loading && quotes.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="small" color={Colors.light.primary} />
                </View>
            ) : quotes.length === 0 ? (
                <View style={styles.empty}>
                    <View style={styles.emptyIllustration}>
                        <Ionicons name="chatbubble-ellipses-outline" size={48} color={Colors.light.border} />
                    </View>
                    <Text style={styles.emptyTitle}>No memories yet</Text>
                    <Text style={styles.emptySub}>Post a quote or moment to start your collection.</Text>
                </View>
            ) : (
                <FlatList
                    data={quotes}
                    keyExtractor={(q) => q.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }) => (
                        <QuoteCard
                            quote={item}
                            index={index}
                            onUpvote={() => toggleUpvote(item.id)}
                            onDelete={() => deleteQuote(item.id)}
                            hasUpvoted={hasUpvoted(item.id)}
                            onSubscribeReplies={subscribeRepliesStable}
                            onAddReply={addReply}
                        />
                    )}
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.9}>
                <Ionicons name="pencil" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <CreateQuoteModal visible={modalVisible} onClose={() => setModalVisible(false)} onSubmit={handleCreate} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: Colors.light.background,
    },
    backBtnSquare: {
        width: 44,
        height: 44,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.light.text,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
        elevation: 2,
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 22,
        color: Colors.light.text,
        letterSpacing: 1,
    },
    introSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    description: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        color: Colors.light.text,
        lineHeight: 22,
        marginBottom: 8,
    },
    subDescription: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.light.textMuted,
        lineHeight: 18,
    },
    sortRow: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sortBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: Colors.light.text,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 0,
        elevation: 2,
    },
    sortBtnActive: { backgroundColor: Colors.light.primary },
    sortText: {
        fontFamily: Fonts.heading,
        fontSize: 11,
        color: Colors.light.text,
        letterSpacing: 0.5,
    },
    sortTextActive: { color: '#FFFFFF' },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 120,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        marginBottom: 100,
    },
    emptyIllustration: {
        width: 80,
        height: 80,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: Colors.light.border,
        borderStyle: 'dashed',
    },
    emptyTitle: {
        fontFamily: Fonts.heading,
        fontSize: 20,
        color: Colors.light.text,
        marginBottom: 8,
    },
    emptySub: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.light.textMuted,
        textAlign: 'center',
        lineHeight: 20,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 24,
        width: 60,
        height: 60,
        backgroundColor: Colors.light.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.light.text,
        shadowColor: '#000',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 0,
        elevation: 8,
    },
    errorText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: Colors.light.error,
        marginTop: 16,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    errorBackBtn: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: Colors.light.primary,
        borderWidth: 2,
        borderColor: Colors.light.text,
    },
    errorBackBtnText: {
        fontFamily: Fonts.heading,
        fontSize: 14,
        color: '#FFFFFF',
        letterSpacing: 1,
    },
});