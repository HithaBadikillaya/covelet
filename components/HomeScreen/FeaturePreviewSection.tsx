import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const features = [
    {
        title: 'Time Capsule',
        description:
            'Users submit messages, photos, or short notes that are locked until a chosen future date. Once unlocked, the group revisits what they were, what they felt, and what they hoped for.',
    },
    {
        title: 'Humans of Our Cove',
        description:
            'A simple profile page for each member with one photo and short prompts to preserve personality and reflections.',
    },
    {
        title: 'Quote & Memory Wall',
        description:
            'Curated wall for quotes, inside jokes, and memorable moments. Members can post reflections and react or upvote posts.',
    },
    {
        title: 'Map of Memories',
        description:
            'Visual map showing locations tied to memories. Users can pin stories, photos, or quotes to specific places.',
    },
    {
        title: 'Cove Playlist with Stories',
        description:
            'Shared playlist where each song includes who added it and why it mattered during specific periods.',
    },
    {
        title: 'Memory Roulette',
        description:
            'Single-button feature that randomly surfaces a photo, quote, or story from the archive, making nostalgia spontaneous.',
    },
];


export const FeaturePreviewSection = () => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const themeColors = Colors[isDark ? 'dark' : 'light'];

    return (
        <View style={styles.container}>
            <View style={styles.headerBox}>
                <Text style={[styles.header, { color: themeColors.text }]}>
                    Core Features
                </Text>
                <View style={[styles.headerLine, { backgroundColor: themeColors.ocean }]} />
            </View>
            <View style={styles.list}>
                {features.map((feature, index) => (
                    <View key={index} style={[styles.item, { borderLeftColor: themeColors.sand, borderLeftWidth: index % 2 === 0 ? 2 : 0, borderRightColor: themeColors.sand, borderRightWidth: index % 2 !== 0 ? 2 : 0 }]}>
                        <View style={styles.textWrapper}>
                            <Text style={[styles.highlightedTitle, { color: themeColors.ocean }]}>
                                {feature.title.toUpperCase()}
                            </Text>
                            <Text style={[styles.featureDescription, { color: themeColors.text }]}>
                                {feature.description}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 80,
        paddingHorizontal: 24,
    },
    headerBox: {
        marginBottom: 48,
    },
    header: {
        fontFamily: Fonts.heading,
        fontSize: 32,
        marginBottom: 12,
    },
    headerLine: {
        width: 40,
        height: 4,
    },
    list: {
        gap: 40,
    },
    item: {
        flexDirection: 'row',
        paddingVertical: 32,
        paddingHorizontal: 20,
        alignItems: 'flex-start',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    textWrapper: {
        flex: 1,
    },
    highlightedTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        letterSpacing: 2,
        marginBottom: 12,
    },
    featureDescription: {
        fontFamily: Fonts.body,
        fontSize: 17,
        lineHeight: 28,
        opacity: 0.9,
    },
});
