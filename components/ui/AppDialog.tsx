import { Colors, Fonts, Layout } from '@/constants/theme';
import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export interface AppDialogAction {
    label: string;
    onPress?: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
}

interface AppDialogProps {
    visible: boolean;
    title: string;
    message: string;
    onClose: () => void;
    actions?: AppDialogAction[];
}

export default function AppDialog({
    visible,
    title,
    message,
    onClose,
    actions = [{ label: 'OK', variant: 'primary' }],
}: AppDialogProps) {
    const handleAction = (action: AppDialogAction) => {
        onClose();
        action.onPress?.();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />

                <View style={styles.modalCard}>
                    <View style={styles.tape} />

                    <Text style={styles.title}>{title.toUpperCase()}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={[styles.actions, actions.length > 1 && styles.actionsSplit]}>
                        {actions.map((action, index) => {
                            const variant = action.variant || 'primary';
                            return (
                                <TouchableOpacity
                                    key={`${action.label}-${index}`}
                                    style={[
                                        styles.button,
                                        variant === 'primary' && styles.buttonPrimary,
                                        variant === 'secondary' && styles.buttonSecondary,
                                        variant === 'danger' && styles.buttonDanger,
                                        actions.length > 1 && styles.buttonFlexible,
                                    ]}
                                    activeOpacity={0.85}
                                    onPress={() => handleAction(action)}
                                >
                                    <Text
                                        style={[
                                            styles.buttonText,
                                            variant === 'secondary' && styles.buttonTextSecondary,
                                        ]}
                                    >
                                        {action.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(47, 46, 44, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalCard: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#FFFFFF',
        padding: 28,
        paddingTop: 40,
        borderWidth: 2,
        borderColor: Colors.light.text,
        borderRadius: Layout.radiusLarge,
        shadowColor: '#000',
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
    title: {
        color: Colors.light.text,
        fontFamily: Fonts.heading,
        fontSize: 22,
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: 1,
    },
    message: {
        color: Colors.light.textMuted,
        fontFamily: Fonts.body,
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 24,
    },
    actions: {
        gap: 12,
    },
    actionsSplit: {
        flexDirection: 'row',
    },
    button: {
        minHeight: 52,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: Layout.radiusMedium,
        borderWidth: 2,
        borderColor: Colors.light.text,
        paddingHorizontal: 18,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
        elevation: 4,
    },
    buttonFlexible: {
        flex: 1,
    },
    buttonPrimary: {
        backgroundColor: Colors.light.primary,
    },
    buttonSecondary: {
        backgroundColor: '#FFFFFF',
    },
    buttonDanger: {
        backgroundColor: Colors.light.error,
    },
    buttonText: {
        color: '#FFFFFF',
        fontFamily: Fonts.heading,
        fontSize: 14,
        letterSpacing: 1,
    },
    buttonTextSecondary: {
        color: Colors.light.text,
    },
});
