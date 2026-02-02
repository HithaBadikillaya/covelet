import { AuthGuard } from '@/components/auth/AuthGuard';
import { CreateQuoteModal } from '@/components/Wall/CreateQuoteModal';
import { QuoteCard } from '@/components/Wall/QuoteCard';
import { FEATURE_DESCRIPTIONS } from '@/constants/features';
import { Colors, Fonts } from '@/constants/theme';
import { useQuotes } from '@/hooks/useQuotes';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
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
    const themeColors = Colors.light;
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
            <AuthGuard>
                <View style={[styles.container, styles.center, { backgroundColor: themeColors.background }]}>
                    <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
                    <TouchableOpacity style={[styles.backBtn, { backgroundColor: themeColors.primary }]} onPress={() => router.back()}>
                        <Text style={styles.backBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: themeColors.text }]}>The Wall</Text>
                    <View style={{ width: 24 }} />
                </View>
                <Text style={[styles.description, { color: themeColors.textMuted }]}>
                    {FEATURE_DESCRIPTIONS.wall}
                </Text>
                <Text style={[styles.subDescription, { color: themeColors.textMuted }]}>
                    {FEATURE_DESCRIPTIONS.threads}
                </Text>
                <View style={styles.sortRow}>
                    <TouchableOpacity
                        style={[styles.sortBtn, sort === 'recent' && { backgroundColor: themeColors.primary }]}
                        onPress={() => setSort('recent')}
                    >
                        <Text style={[styles.sortText, sort === 'recent' && { color: '#fff' }]}>Recent</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.sortBtn, sort === 'upvoted' && { backgroundColor: themeColors.primary }]}
                        onPress={() => setSort('upvoted')}
                    >
                        <Text style={[styles.sortText, sort === 'upvoted' && { color: '#fff' }]}>Most upvoted</Text>
                    </TouchableOpacity>
                </View>
                {loading && quotes.length === 0 ? (
                    <View style={styles.center}><Text style={{ color: themeColors.textMuted }}>Loading...</Text></View>
                ) : quotes.length === 0 ? (
                    <View style={styles.empty}>
                        <Ionicons name="chatbubble-ellipses-outline" size={64} color={themeColors.textMuted} />
                        <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No memories yet</Text>
                        <Text style={[styles.emptySub, { color: themeColors.textMuted }]}>Post a quote or moment to get started.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={quotes}
                        keyExtractor={(q) => q.id}
                        contentContainerStyle={styles.list}
                        renderItem={({ item }) => (
                            <QuoteCard
                                quote={item}
                                onUpvote={() => toggleUpvote(item.id, item.upvotesCount)}
                                onDelete={() => deleteQuote(item.id)}
                                hasUpvoted={hasUpvoted(item.id)}
                                onSubscribeReplies={subscribeRepliesStable}
                                onAddReply={addReply}
                            />
                        )}
                    />
                )}
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: themeColors.primary }]}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
                <CreateQuoteModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    onSubmit={handleCreate}
                />
            </View>
        </AuthGuard>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
    title: { fontFamily: Fonts.heading, fontSize: 20 },
    description: { fontFamily: Fonts.body, fontSize: 14, paddingHorizontal: 20, marginBottom: 4 },
    subDescription: { fontFamily: Fonts.body, fontSize: 12, paddingHorizontal: 20, marginBottom: 16, opacity: 0.9 },
    sortRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
    sortBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
    sortText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: '#A3A3A3' },
    list: { paddingHorizontal: 20, paddingBottom: 100 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontFamily: Fonts.heading, fontSize: 20, marginTop: 16 },
    emptySub: { fontFamily: Fonts.body, fontSize: 14, marginTop: 8 },
    errorText: { fontFamily: Fonts.body, marginBottom: 16 },
    backBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
    backBtnText: { fontFamily: Fonts.heading, color: '#fff' },
    fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
});
