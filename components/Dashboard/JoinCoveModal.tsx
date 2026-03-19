import { findCoveIdByJoinCode, joinCoveById } from '@/utils/coveJoinCodes';
import { isValidJoinCode, normalizeJoinCode } from '@/utils/security';
import { Colors, Fonts, Layout } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Props {
    visible: boolean;
    onClose: () => void;
    onJoin: (coveId: string) => void;
}

export default function JoinCoveModal({ visible, onClose, onJoin }: Props) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const inputRef = useRef<TextInput>(null);
    const auth = getAuth();

    const handleCloseInternal = () => {
        setCode('');
        setErrorMsg(null);
        inputRef.current?.clear();
        Keyboard.dismiss();
        onClose();
    };

    const handleJoin = async () => {
        const trimmedCode = normalizeJoinCode(code);
        if (!isValidJoinCode(trimmedCode)) {
            setErrorMsg('Enter a valid 6-character invite code.');
            return;
        }

        if (!auth.currentUser) {
            setErrorMsg('Sign in first to join a Cove.');
            return;
        }

        setLoading(true);
        setErrorMsg(null);

        try {
            const coveId = await findCoveIdByJoinCode(trimmedCode);
            if (!coveId) {
                setErrorMsg('No Cove found with this code. Double check it.');
                setLoading(false);
                return;
            }

            await joinCoveById(coveId, auth.currentUser.uid);

            setLoading(false);
            handleCloseInternal();
            onJoin(coveId);
        } catch (error: any) {
            if (error.code === 'permission-denied' || error.code === 'not-found') {
                setErrorMsg('That invite code is invalid, expired, or you already belong to this Cove.');
            } else {
                setErrorMsg('Something went wrong. Please try again later.');
            }
            setLoading(false);
        }
    };

    const handleCodeChange = (text: string) => {
        setErrorMsg(null);
        setCode(normalizeJoinCode(text));
    };

    const renderBoxes = () => {
        const boxes = [];
        for (let i = 0; i < 6; i += 1) {
            const char = code[i] || '';
            const isFocused = i === code.length;
            boxes.push(
                <View
                    key={i}
                    style={[
                        styles.box,
                        isFocused ? styles.boxFocused : styles.boxUnfocused,
                    ]}
                >
                    <Text style={[styles.boxText, isFocused && { color: Colors.light.primary }]}>{char}</Text>
                </View>
            );
        }
        return boxes;
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={handleCloseInternal}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <Pressable style={styles.backdrop} onPress={handleCloseInternal} />

                <View style={styles.modalCard}>
                    <View style={styles.tape} />

                    <TouchableOpacity style={styles.closeIcon} onPress={handleCloseInternal}>
                        <Ionicons name="close" size={24} color={Colors.light.text} />
                    </TouchableOpacity>

                    <Text style={styles.title}>JOIN A COVE</Text>
                    <Text style={styles.subtitle}>Enter the invitation code to enter a shared sanctuary.</Text>

                    <View style={styles.codeRow}>
                        {renderBoxes()}
                        <TextInput
                            ref={inputRef}
                            onChangeText={handleCodeChange}
                            value={code}
                            maxLength={6}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            autoFocus={false}
                            caretHidden={true}
                            allowFontScaling={false}
                            contextMenuHidden={true}
                            style={styles.ghostInput}
                            keyboardType="default"
                            cursorColor="transparent"
                        />
                    </View>

                    {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                    <TouchableOpacity
                        style={[
                            styles.joinButton,
                            code.length === 6 && !loading ? styles.joinButtonActive : styles.joinButtonDisabled,
                        ]}
                        onPress={handleJoin}
                        disabled={code.length !== 6 || loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.joinButtonText}>ENTER COVE</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(47, 46, 44, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalCard: {
        width: '90%',
        maxWidth: 400,
        backgroundColor: '#FFFFFF',
        padding: 32,
        paddingTop: 48,
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
    closeIcon: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
    },
    title: {
        color: Colors.light.text,
        fontFamily: Fonts.heading,
        fontSize: 24,
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: 1,
    },
    subtitle: {
        color: Colors.light.textMuted,
        fontFamily: Fonts.body,
        fontSize: 14,
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 20,
    },
    ghostInput: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0,
        color: 'transparent',
    },
    codeRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 24,
    },
    box: {
        width: 44,
        height: 54,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FDFBF7',
        marginHorizontal: 3,
        borderRadius: 0,
        borderColor: Colors.light.border,
    },
    boxFocused: {
        borderColor: Colors.light.primary,
        backgroundColor: '#FFFFFF',
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        elevation: 2,
    },
    boxUnfocused: {
        borderColor: Colors.light.border,
    },
    boxText: {
        color: Colors.light.text,
        fontFamily: Fonts.heading,
        fontSize: 22,
    },
    errorText: {
        color: '#DC2626',
        fontFamily: Fonts.body,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
    },
    joinButton: {
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Layout.radiusMedium,
        borderWidth: 2,
        borderColor: Colors.light.text,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
        elevation: 4,
    },
    joinButtonActive: {
        backgroundColor: Colors.light.primary,
    },
    joinButtonDisabled: {
        backgroundColor: Colors.light.muted,
        borderColor: Colors.light.border,
        opacity: 0.6,
    },
    joinButtonText: {
        color: '#FFFFFF',
        fontFamily: Fonts.heading,
        fontSize: 14,
        letterSpacing: 1,
    },
});