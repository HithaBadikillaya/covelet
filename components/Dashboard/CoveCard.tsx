import { Colors, Fonts, Layout } from '@/constants/theme';
import { getCoveBackgroundUrl } from '@/utils/avatar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface CoveCardProps {
    cove: {
        name: string;
        description?: string;
        members?: string[];
        avatarSeed?: string;
    };
    isOwner?: boolean;
    onPress: () => void;
    index: number;
}

const CoveCard = ({ cove, isOwner, onPress, index }: CoveCardProps) => {
    const bgUrl = getCoveBackgroundUrl(cove.avatarSeed || '');

    return (
        <View style={styles.wrapper}>
            <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                <View
                    style={[
                        styles.tape,
                        {
                            backgroundColor: index % 3 === 0 ? '#4A6741' : '#D4A373',
                            opacity: 0.4,
                        },
                    ]}
                />

                <View style={styles.photoArea}>
                    <Image source={{ uri: bgUrl }} style={styles.backgroundImage} contentFit="cover" />
                </View>

                <View style={styles.labelArea}>
                    <View style={styles.header}>
                        <Text style={styles.name} numberOfLines={1}>{cove.name}</Text>
                        {isOwner ? (
                            <View style={styles.ownerBadge}>
                                <Text style={styles.ownerText}>OWNER</Text>
                            </View>
                        ) : null}
                    </View>

                    {cove.description ? (
                        <Text style={styles.description} numberOfLines={2}>{cove.description}</Text>
                    ) : null}

                    <View style={styles.footer}>
                        <Ionicons name="people-outline" size={12} color={Colors.light.textMuted} />
                        <Text style={styles.members}>{cove.members?.length || 0}</Text>
                    </View>
                </View>
            </Pressable>
        </View>
    );
};

export default CoveCard;

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        marginBottom: 20,
        padding: 4,
    },
    featuredWrapper: {
        marginBottom: 32,
    },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 10,
        paddingBottom: 24,
        borderRadius: Layout.radiusLarge,
        borderWidth: 2,
        borderColor: Colors.light.text,
        shadowColor: '#2F2E2C',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 0,
        elevation: 4,
    },
    cardPressed: {
        backgroundColor: '#F9F7F2',
        transform: [{ translateX: 2 }, { translateY: 2 }],
        shadowOffset: { width: 2, height: 2 },
    },
    tape: {
        position: 'absolute',
        top: -8,
        alignSelf: 'center',
        width: 70,
        height: 18,
        zIndex: 10,
    },
    photoArea: {
        aspectRatio: 1,
        backgroundColor: '#FDFBF7',
        borderRadius: 0,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: Colors.light.border,
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.8,
    },
    photoOverlay: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.light.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    labelArea: {
        paddingHorizontal: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    name: {
        fontFamily: Fonts.heading,
        fontSize: 18,
        color: Colors.light.text,
        flex: 1,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    ownerBadge: {
        borderWidth: 1,
        borderColor: Colors.light.primary,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 0,
        marginLeft: 8,
    },
    ownerText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 9,
        color: Colors.light.primary,
    },
    description: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.light.textMuted,
        lineHeight: 18,
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 'auto',
    },
    members: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 12,
        color: Colors.light.textMuted,
        marginLeft: 4,
    },
});