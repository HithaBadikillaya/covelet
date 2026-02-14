import { AuthGuard } from '@/components/auth/AuthGuard';
import { CreateQuoteModal } from '@/components/Wall/CreateQuoteModal';
import { QuoteCard } from '@/components/Wall/QuoteCard';
import { FEATURE_DESCRIPTIONS } from '@/constants/features';
import { Colors, Fonts } from '@/constants/theme';
import { useQuotes } from '@/hooks/useQuotes';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    FlatList,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CARAMEL = '#C8A97E';

export default function WallScreen() {
  const { coveId } = useLocalSearchParams<{ coveId: string }>();
  const themeColors = Colors.light;
  const [modalVisible, setModalVisible] = useState(false);

  const {
    quotes,
    loading,
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
    (quoteId: string, onReplies: any) =>
      subscribeReplies(quoteId, onReplies),
    [subscribeReplies]
  );

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      <Text style={[styles.pageTitle, { color: themeColors.text }]}>
        The Wall
      </Text>

      <Text style={[styles.description, { color: themeColors.textMuted }]}>
        {FEATURE_DESCRIPTIONS.wall}
      </Text>

      <Text style={[styles.subDescription, { color: themeColors.textMuted }]}>
        {FEATURE_DESCRIPTIONS.threads}
      </Text>

      <View style={styles.sortRow}>
        <TouchableOpacity
          style={[
            styles.sortBtn,
            sort === 'recent' && styles.activeSortBtn,
          ]}
          onPress={() => setSort('recent')}
        >
          <Text
            style={[
              styles.sortText,
              sort === 'recent' && styles.activeSortText,
            ]}
          >
            Recent
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sortBtn,
            sort === 'upvoted' && styles.activeSortBtn,
          ]}
          onPress={() => setSort('upvoted')}
        >
          <Text
            style={[
              styles.sortText,
              sort === 'upvoted' && styles.activeSortText,
            ]}
          >
            Most upvoted
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <AuthGuard>
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: themeColors.background }]}
        edges={['top']}
      >
        <FlatList
          data={quotes}
          keyExtractor={(q) => q.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <QuoteCard
              quote={item}
              onUpvote={() => toggleUpvote(item.id)}
              onDelete={() => deleteQuote(item.id)}
              hasUpvoted={hasUpvoted(item.id)}
              onSubscribeReplies={subscribeRepliesStable}
              onAddReply={addReply}
            />
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyWrapper}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={72}
                  color={themeColors.textMuted}
                />
                <Text
                  style={[styles.emptyTitle, { color: themeColors.text }]}
                >
                  No memories yet
                </Text>
                <Text
                  style={[styles.emptySub, { color: themeColors.textMuted }]}
                >
                  Post a quote or moment to get started.
                </Text>
              </View>
            ) : (
              <View style={styles.loadingWrapper}>
                <Text style={{ color: themeColors.textMuted }}>
                  Loading...
                </Text>
              </View>
            )
          }
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#000" />
        </TouchableOpacity>

        <CreateQuoteModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSubmit={handleCreate}
        />
      </SafeAreaView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  headerWrapper: {
    paddingHorizontal: 24,
    paddingTop:
      Platform.OS === 'android'
        ? (StatusBar.currentHeight || 0) + 20
        : 20,
    paddingBottom: 24,
  },

  pageTitle: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    marginBottom: 12,
  },

  description: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6,
  },

  subDescription: {
    fontFamily: Fonts.body,
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 24,
  },

  sortRow: {
    flexDirection: 'row',
  },

  sortBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: '#1a1a1a',
    marginRight: 12,
  },

  activeSortBtn: {
    backgroundColor: CARAMEL,
  },

  sortText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: '#888',
  },

  activeSortText: {
    color: '#000',
  },

  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 140,
  },

  emptyWrapper: {
    alignItems: 'center',
    marginTop: 120,
    paddingHorizontal: 40,
  },

  emptyTitle: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    marginTop: 24,
  },

  emptySub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    opacity: 0.7,
  },

  loadingWrapper: {
    marginTop: 140,
    alignItems: 'center',
  },

  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: CARAMEL,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
});
