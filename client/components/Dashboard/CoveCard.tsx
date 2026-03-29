import { Colors, Fonts, Layout } from '@/constants/theme';
import { getCoveBackgroundUrl } from '@/utils/avatar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
            <TouchableOpacity 
                onPress={onPress} 
                activeOpacity={0.9}
                style={styles.card}
            >
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
            </TouchableOpacity>
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
        padding: 12,
        paddingBottom: 48, // Classic Polaroid "chin"
        borderRadius: 0,
        borderWidth: 2.5,
        borderColor: '#2F2E2C', // Explicit Deep Charcoal
        shadowColor: '#000',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 0,
        elevation: 6,
    },
    cardPressed: {
        backgroundColor: '#FDFBF7',
        transform: [{ translateX: 2 }, { translateY: 2 }],
        shadowOffset: { width: 2, height: 2 },
    },
    tape: {
        position: 'absolute',
        top: -10,
        alignSelf: 'center',
        width: 80,
        height: 22,
        zIndex: 10,
        opacity: 0.6,
    },
    photoArea: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#F9F7F2',
        borderRadius: 0,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#E8E2D9', // Explicit Subtle border
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