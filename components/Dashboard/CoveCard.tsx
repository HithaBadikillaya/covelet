import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CoveCardProps {
    name: string;
    description?: string;
    memberCount: number;
    code: string;
    onPress: () => void;
}

export const CoveCard: React.FC<CoveCardProps> = ({ name, description, memberCount, code, onPress }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const themeColors = Colors[isDark ? 'dark' : 'light'];

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: themeColors.sand }]}
        >
            <View style={styles.header}>
                <View style={styles.titleWrapper}>
                    <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>
                        {name}
                    </Text>
                    {description ? (
                        <Text style={[styles.description, { color: themeColors.text }]} numberOfLines={2}>
                            {description}
                        </Text>
                    ) : null}
                </View>
                <View style={[styles.iconBox, { backgroundColor: themeColors.ocean + '15' }]}>
                    <Ionicons name="boat-outline" size={24} color={themeColors.ocean} />
                </View>
            </View>

            <View style={[styles.footer, { borderTopColor: themeColors.sand + '40' }]}>
                <View style={styles.stats}>
                    <Ionicons name="people-outline" size={16} color={themeColors.text} style={{ opacity: 0.6 }} />
                    <Text style={[styles.statText, { color: themeColors.text }]}>
                        {memberCount} {memberCount === 1 ? 'member' : 'members'}
                    </Text>
                </View>
                <View style={[styles.codeBadge, { backgroundColor: themeColors.ocean }]}>
                    <Text style={styles.codeText}>{code}</Text>
                </View>
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
    title: {
        fontFamily: Fonts.heading,
        fontSize: 22,
        marginBottom: 8,
    },
    description: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 20,
        opacity: 0.7,
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
        opacity: 0.6,
    },
    codeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    codeText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        color: '#FFFFFF',
        letterSpacing: 1,
    },
});
