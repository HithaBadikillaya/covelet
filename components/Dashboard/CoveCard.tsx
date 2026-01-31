import { Colors, Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CoveCardProps {
    name: string;
    description?: string;
    memberCount: number;
    isOwner: boolean;
    onPress: () => void;
}

export const CoveCard: React.FC<CoveCardProps> = ({ name, description, memberCount, isOwner, onPress }) => {
    const themeColors = Colors.light;

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
        >
            <View style={styles.header}>
                <View style={styles.titleWrapper}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>
                            {name}
                        </Text>
                        {isOwner && (
                            <View style={[styles.ownerBadge, { backgroundColor: themeColors.primary + '20', borderColor: themeColors.primary }]}>
                                <Text style={[styles.ownerBadgeText, { color: themeColors.primary }]}>Owner</Text>
                            </View>
                        )}
                    </View>
                    {description ? (
                        <Text style={[styles.description, { color: themeColors.textMuted }]} numberOfLines={2}>
                            {description}
                        </Text>
                    ) : null}
                </View>
                <View style={[styles.iconBox, { backgroundColor: themeColors.primary + '10' }]}>
                    <Ionicons name="boat-outline" size={24} color={themeColors.primary} />
                </View>
            </View>

            <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
                <View style={styles.stats}>
                    <Ionicons name="people-outline" size={16} color={themeColors.textMuted} />
                    <Text style={[styles.statText, { color: themeColors.textMuted }]}>
                        {memberCount} {memberCount === 1 ? 'member' : 'members'}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={themeColors.textMuted} />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '100%',
        padding: 24,
        borderWidth: 1,
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    titleWrapper: {
        flex: 1,
        marginRight: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 22,
    },
    ownerBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderWidth: 1,
        borderRadius: 4,
    },
    ownerBadgeText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 10,
        textTransform: 'uppercase',
    },
    description: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 20,
    },
    iconBox: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
    },
    stats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
    },
});
