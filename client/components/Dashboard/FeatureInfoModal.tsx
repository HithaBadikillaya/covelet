import { Colors, Fonts, Layout } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
    visible: boolean;
    onClose: () => void;
    title: string;
    description: string;
    iconName?: keyof typeof Ionicons.glyphMap;
    howToUse?: string[];
    tip?: string;
}

export default function FeatureInfoModal({
    visible,
    onClose,
    title,
    description,
    iconName = "information-circle-outline",
    howToUse = [],
    tip,
}: Props) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.overlay}
            >
                <Pressable style={styles.backdrop} onPress={onClose} />

                <View style={styles.modalCard}>
                    <View style={styles.tape} />

                    <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
                        <Ionicons name="close" size={24} color={Colors.light.text} />
                    </TouchableOpacity>

                    <View style={styles.iconContainer}>
                        <Ionicons name={iconName} size={48} color={Colors.light.text} />
                    </View>

                    <Text style={styles.title}>{title.toUpperCase()}</Text>
                    <Text style={styles.subtitle}>{description}</Text>

                    {howToUse.length > 0 ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>HOW TO USE IT</Text>
                            {howToUse.map((step, index) => (
                                <View key={`${title}-step-${index}`} style={styles.stepRow}>
                                    <View style={styles.stepBadge}>
                                        <Text style={styles.stepBadgeText}>{index + 1}</Text>
                                    </View>
                                    <Text style={styles.stepText}>{step}</Text>
                                </View>
                            ))}
                        </View>
                    ) : null}

                    {tip ? (
                        <View style={styles.tipBox}>
                            <Ionicons name="sparkles-outline" size={16} color={Colors.light.primary} />
                            <Text style={styles.tipText}>{tip}</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.joinButton, styles.joinButtonActive]}
                        onPress={onClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.joinButtonText}>GOT IT</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(47, 46, 44, 0.4)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 18,
    },
    backdrop: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalCard: {
        width: "100%",
        maxWidth: 420,
        backgroundColor: "#FFFFFF",
        padding: 28,
        paddingTop: 48,
        borderWidth: 2,
        borderColor: Colors.light.text,
        borderRadius: Layout.radiusLarge,
        shadowColor: "#000",
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 0,
        elevation: 8,
    },
    tape: {
        position: 'absolute',
        top: -12,
        alignSelf: 'center',
        width: 80,
        height: 24,
        backgroundColor: Colors.light.secondary,
        opacity: 0.5,
    },
    closeIcon: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        color: Colors.light.text,
        fontFamily: Fonts.heading,
        fontSize: 24,
        marginBottom: 12,
        textAlign: "center",
        letterSpacing: 1,
    },
    subtitle: {
        color: Colors.light.textMuted,
        fontFamily: Fonts.body,
        fontSize: 15,
        marginBottom: 24,
        textAlign: "center",
        lineHeight: 22,
    },
    section: {
        gap: 12,
        marginBottom: 20,
    },
    sectionTitle: {
        color: Colors.light.text,
        fontFamily: Fonts.heading,
        fontSize: 12,
        letterSpacing: 1,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    stepBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.light.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
    },
    stepBadgeText: {
        color: '#FFFFFF',
        fontFamily: Fonts.heading,
        fontSize: 12,
    },
    stepText: {
        flex: 1,
        color: Colors.light.text,
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 20,
    },
    tipBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: '#F7F3E8',
        borderRadius: Layout.radiusMedium,
        padding: 14,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    tipText: {
        flex: 1,
        color: Colors.light.text,
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 19,
    },
    joinButton: {
        height: 56,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: Layout.radiusMedium,
        borderWidth: 2,
        borderColor: Colors.light.text,
        shadowColor: "#000",
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
        elevation: 4,
    },
    joinButtonActive: {
        backgroundColor: Colors.light.primary,
    },
    joinButtonText: {
        color: "#FFFFFF",
        fontFamily: Fonts.heading,
        fontSize: 14,
        letterSpacing: 1,
    },
});