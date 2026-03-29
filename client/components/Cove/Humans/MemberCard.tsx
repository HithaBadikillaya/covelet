import { Colors, Fonts, Layout } from '@/constants/theme';
import { getPfpUrl } from '@/utils/avatar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface MemberCardProps {
    member: {
        id: string;
        name: string;
        avatarSeed: string;
        role?: string;
        bio?: string;
        joinedAt?: { seconds: number } | null;
    };
    coveBackgroundUrl: string;
    isCurrentUser?: boolean;
    onPress?: () => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, coveBackgroundUrl, isCurrentUser, onPress }) => {
    const pfpUrl = getPfpUrl(member.avatarSeed);

    const joinDate = member.joinedAt
        ? new Date(member.joinedAt.seconds * 1000).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
        : 'New Member';

    return (
        <View style={styles.container}>
            <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }] }]}> 
                <Image source={{ uri: coveBackgroundUrl }} style={styles.background} contentFit="cover" />

                <View style={styles.content}>
                    <View style={styles.pfpWrapper}>
                        <Image source={{ uri: pfpUrl }} style={styles.pfp} contentFit="contain" />
                        {isCurrentUser ? (
                            <View style={styles.editBadge}>
                                <Ionicons name="pencil" size={12} color="#FFFFFF" />
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.info}>
                        <Text style={styles.name} numberOfLines={1}>{member.name.toUpperCase()}</Text>

                        {member.role ? (
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleText}>{member.role.toUpperCase()}</Text>
                            </View>
                        ) : (
                            <Text style={styles.joinDate}>Member since {joinDate}</Text>
                        )}

                        {member.bio ? <Text style={styles.bio}>{member.bio}</Text> : null}
                    </View>
                </View>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingVertical: 10,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: Layout.radiusLarge,
        borderWidth: 2,
        borderColor: Colors.light.text,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
        elevation: 4,
    },
    background: {
        width: '100%',
        height: 80,
        backgroundColor: Colors.light.secondary + '20',
        opacity: 0.6,
    },
    content: {
        padding: 16,
        paddingTop: 0,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    pfpWrapper: {
        width: 80,
        height: 80,
        borderRadius: 0,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: Colors.light.text,
        marginTop: -40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
    },
    pfp: {
        width: '100%',
        height: '100%',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.light.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    info: {
        flex: 1,
        marginLeft: 16,
        marginTop: 8,
    },
    name: {
        fontFamily: Fonts.heading,
        fontSize: 20,
        color: Colors.light.text,
        letterSpacing: 0.5,
    },
    roleBadge: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.light.primary + '15',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: Colors.light.primary,
        marginTop: 4,
        marginBottom: 8,
    },
    roleText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 10,
        color: Colors.light.primary,
        letterSpacing: 1,
    },
    joinDate: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.light.textMuted,
        marginTop: 2,
        marginBottom: 8,
    },
    bio: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.light.text,
        lineHeight: 20,
        opacity: 0.8,
    },
});