import { joinCoveByCode } from '@/utils/coveJoinCodes';
import { isValidJoinCode, normalizeJoinCode, SECURITY_LIMITS } from '@/utils/security';
import { Colors, Fonts, Layout } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
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
    const [isInputFocused, setIsInputFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const auth = getAuth();
    const normalizedCode = normalizeJoinCode(code);
    const isJoinCodeComplete = normalizedCode.length === SECURITY_LIMITS.joinCodeLength;

    useEffect(() => {
        if (!visible) {
            return;
        }

        const focusFrame = requestAnimationFrame(() => {
            inputRef.current?.focus();
        });

        return () => cancelAnimationFrame(focusFrame);
    }, [visible]);

    const handleCloseInternal = () => {
        setCode('');
        setErrorMsg(null);
        setIsInputFocused(false);
        inputRef.current?.blur();
        Keyboard.dismiss();
        onClose();
    };

    const handleJoin = async () => {
        if (!isValidJoinCode(normalizedCode)) {
            setErrorMsg(`Enter a valid ${SECURITY_LIMITS.joinCodeLength}-character invite code.`);
            return;
        }

        if (!auth?.currentUser) {
            setErrorMsg('Sign in first to join a Cove.');
            return;
        }

        setLoading(true);
        setErrorMsg(null);

        try {
            const result = await joinCoveByCode(normalizedCode);
            if (!result?.coveId) {
                throw new Error('Failed to join this Cove.');
            }

            setLoading(false);
            handleCloseInternal();
            onJoin(result.coveId);
        } catch (error: any) {
            if (error.code === 'NOT_FOUND' || error.code === 'VALIDATION_ERROR') {
                setErrorMsg('That invite code is invalid, expired, or you already belong to this Cove.');
            } else if (error.code === 'COVE_FULL') {
                setErrorMsg('This Cove is full right now.');
            } else if (error.code === 'NETWORK_ERROR') {
                setErrorMsg('Unable to reach the server right now. Please try again.');
            } else {
                setErrorMsg(error.message || 'Something went wrong. Please try again later.');
            }
            setLoading(false);
        }
    };

    const handleCodeChange = (text: string) => {
        setErrorMsg(null);
        const nextCode = normalizeJoinCode(text);
        setCode((current) => (current === nextCode ? current : nextCode));
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

                    <View style={styles.codeInputWrapper}>
                        <TextInput
                            ref={inputRef}
                            value={code}
                            onChangeText={handleCodeChange}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoCorrect={false}
                            blurOnSubmit={false}
                            caretHidden={true}
                            contextMenuHidden={true}
                            importantForAutofill="no"
                            keyboardType={
                                Platform.OS === 'android'
                                    ? 'visible-password'
                                    : 'ascii-capable'
                            }
                            maxLength={SECURITY_LIMITS.joinCodeLength * 2}
                            onSubmitEditing={() => {
                                if (isJoinCodeComplete && !loading) {
                                    handleJoin();
                                }
                            }}
                            returnKeyType="done"
                            selectionColor="transparent"
                            selection={{ start: code.length, end: code.length }}
                            showSoftInputOnFocus={true}
                            spellCheck={false}
                            style={styles.codeOverlayInput}
                            textContentType="none"
                        />

                        <View pointerEvents="none" style={styles.codeRow}>
                            {Array.from({ length: SECURITY_LIMITS.joinCodeLength }, (_, index) => {
                                const char = normalizedCode[index] || '';
                                const isFilled = Boolean(char);
                                const isActive = isInputFocused
                                    && (normalizedCode.length === index
                                        || (normalizedCode.length === SECURITY_LIMITS.joinCodeLength
                                            && index === SECURITY_LIMITS.joinCodeLength - 1));

                                return (
                                    <View
                                        key={index}
                                        style={[
                                            styles.codeCell,
                                            isFilled && styles.codeCellFilled,
                                            isActive && styles.codeCellFocused,
                                        ]}
                                    >
                                        <Text style={styles.codeCellText}>{char}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    <Text style={styles.helperText}>Type your 6-letter or number invite code.</Text>

                    {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                    <TouchableOpacity
                        style={[
                            styles.joinButton,
                            isJoinCodeComplete && !loading ? styles.joinButtonActive : styles.joinButtonDisabled,
                        ]}
                        onPress={handleJoin}
                        disabled={!isJoinCodeComplete || loading}
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
    codeInputWrapper: {
        position: 'relative',
        marginBottom: 12,
        minHeight: 58,
    },
    codeOverlayInput: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 2,
        color: 'transparent',
        backgroundColor: 'transparent',
        padding: 0,
    },
    codeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    codeCell: {
        flex: 1,
        minHeight: 58,
        borderWidth: 2,
        borderColor: Colors.light.border,
        borderRadius: 8,
        backgroundColor: '#FDFBF7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    codeCellFilled: {
        borderColor: Colors.light.text,
        backgroundColor: '#FFFFFF',
    },
    codeCellFocused: {
        borderColor: Colors.light.primary,
        backgroundColor: '#FFFFFF',
    },
    codeCellText: {
        fontFamily: Fonts.heading,
        fontSize: 28,
        color: Colors.light.text,
        textTransform: 'uppercase',
    },
    helperText: {
        color: Colors.light.textMuted,
        fontFamily: Fonts.body,
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 20,
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
