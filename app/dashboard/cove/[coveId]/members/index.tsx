import { EditMemberCardModal } from '@/components/Cove/Humans/EditMemberCardModal';
import { MemberCard } from '@/components/Cove/Humans/MemberCard';
import { Colors, Fonts, Layout } from '@/constants/theme';
import { auth } from '@/firebaseConfig';
import { useCoveMembers } from '@/hooks/useCoveMembers';
import { getCoveBackgroundUrl } from '@/utils/avatar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HumansScreen() {
    const { coveId } = useLocalSearchParams<{ coveId: string }>();
    const insets = useSafeAreaInsets();
    const currentUser = auth.currentUser;

    const { members, coveAvatarSeed, loading, error } = useCoveMembers(coveId);
    const [editModalVisible, setEditModalVisible] = useState(false);

    const coveBgUrl = getCoveBackgroundUrl(coveAvatarSeed);

    if (loading && members.length === 0) {
        return (
            <View style={[styles.container, styles.centerAll, { backgroundColor: Colors.light.background }]}> 
                <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
        );
    }

    if (error && members.length === 0) {
        return (
            <View style={[styles.container, styles.centerAll, { backgroundColor: Colors.light.background }]}> 
                <Ionicons name="alert-circle-outline" size={64} color={Colors.light.error} />
                <Text style={[styles.errorText, { color: Colors.light.error }]}>{error}</Text>
                <TouchableOpacity style={[styles.retryButton, { backgroundColor: Colors.light.primary }]} onPress={() => router.back()}>
                    <Text style={styles.retryText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentMember = members.find(m => m.id === currentUser?.uid);

    return (
        <View style={[styles.container, { backgroundColor: Colors.light.background }]}> 
            <View style={styles.headerWrapper}>
                <Image source={{ uri: coveBgUrl }} style={styles.headerBg} contentFit="cover" />
                <View style={[styles.header, { paddingTop: insets.top + 10, paddingBottom: 20 }]}> 
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtnCircle}>
                        <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>HUMANS OF COVE</Text>
                    </View>
                    <View style={{ width: 44 }} />
                </View>
            </View>

            <FlatList
                data={members}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <MemberCard
                        member={item}
                        coveBackgroundUrl={coveBgUrl}
                        isCurrentUser={item.id === currentUser?.uid}
                        onPress={item.id === currentUser?.uid ? () => setEditModalVisible(true) : undefined}
                    />
                )}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={() => (
                    <View style={styles.introBox}>
                        <Text style={styles.introText}>{"A sanctuary isn't built of stone or code, but of the spirits gathered within."}</Text>
                    </View>
                )}
            />

            {currentMember ? (
                <EditMemberCardModal
                    visible={editModalVisible}
                    onClose={() => setEditModalVisible(false)}
                    coveId={coveId!}
                    currentMember={currentMember}
                />
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerAll: { justifyContent: 'center', alignItems: 'center' },
    headerWrapper: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 2,
        borderBottomColor: Colors.light.text,
        overflow: 'hidden',
    },
    headerBg: { ...StyleSheet.absoluteFillObject, opacity: 0.15 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    titleContainer: { flex: 1, alignItems: 'center' },
    backBtnCircle: {
        width: 44,
        height: 44,
        borderRadius: Layout.radiusLarge,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.light.text,
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 20,
        color: Colors.light.text,
        letterSpacing: 1,
    },
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    introBox: {
        paddingVertical: 24,
        paddingHorizontal: 8,
        borderBottomWidth: 1.5,
        borderBottomColor: Colors.light.border,
        marginBottom: 20,
        borderStyle: 'dashed',
    },
    introText: {
        fontFamily: Fonts.body,
        fontSize: 15,
        color: Colors.light.textMuted,
        textAlign: 'center',
        lineHeight: 22,
        fontStyle: 'italic',
    },
    errorText: {
        fontFamily: Fonts.body,
        fontSize: 16,
        color: Colors.light.error,
        marginTop: 16,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 0,
        borderWidth: 2,
        borderColor: Colors.light.text,
    },
    retryText: {
        fontFamily: Fonts.heading,
        fontSize: 16,
        color: '#FFFFFF',
    },
});