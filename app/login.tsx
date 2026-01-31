import { resetPassword, signIn, signUp } from '@/components/auth/authService';
import { Colors, Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { auth } from '@/firebaseConfig';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const themeColors = Colors.light;

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    });

    React.useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);
            setLoading(true);
            signInWithCredential(auth, credential)
                .then(() => {
                    router.replace('/(tabs)/dashboard');
                })
                .catch((err) => {
                    setError('Google Sign-In failed: ' + err.message);
                })
                .finally(() => setLoading(false));
        }
    }, [response]);

    const handleGoogleSignIn = () => {
        if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
            setError('Google Client IDs not configured. Please add them to your .env file.');
            return;
        }
        promptAsync();
    };

    const handleAuth = async () => {
        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }

        setError(null);
        setLoading(true);
        try {
            if (isLogin) {
                await signIn(email, password);
            } else {
                await signUp(email, password);
            }
            router.replace('/(tabs)/dashboard');
        } catch (err: any) {
            setError(err.message || 'Authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Please enter your email address first.');
            return;
        }
        setError(null);
        setLoading(true);
        try {
            await resetPassword(email);
            setSuccess('Password reset link sent to your email.');
        } catch (err: any) {
            setError(err.message || 'Failed to send reset link.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={[styles.loginCard, { backgroundColor: themeColors.card }]}>
                        <Text style={[styles.title, { color: themeColors.text }]}>
                            {isLogin ? 'Welcome back' : 'Create an Account'}
                        </Text>
                        <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
                            {isLogin ? 'Enter your details to access your Coves.' : 'Join Covelet and start sharing memories.'}
                        </Text>

                        {error && (
                            <View style={[styles.errorBox, { borderColor: themeColors.error }]}>
                                <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
                            </View>
                        )}

                        {success && (
                            <View style={[styles.successBox, { borderColor: themeColors.success }]}>
                                <Text style={[styles.successText, { color: themeColors.success }]}>{success}</Text>
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: themeColors.text }]}>Email</Text>
                            <TextInput
                                style={[styles.input, { borderColor: themeColors.border, color: themeColors.text, backgroundColor: themeColors.background }]}
                                placeholder="hello@example.com"
                                placeholderTextColor={themeColors.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: themeColors.text }]}>Password</Text>
                            <TextInput
                                style={[styles.input, { borderColor: themeColors.border, color: themeColors.text, backgroundColor: themeColors.background }]}
                                placeholder="••••••••"
                                placeholderTextColor={themeColors.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        {isLogin && (
                            <TouchableOpacity onPress={handleForgotPassword}>
                                <Text style={[styles.forgotPassword, { color: themeColors.primary }]}>Forgot password?</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={[styles.button, { backgroundColor: themeColors.primary }]}
                            onPress={handleAuth}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={themeColors.background} />
                            ) : (
                                <Text style={[styles.buttonText, { color: themeColors.background }]}>
                                    {isLogin ? 'Sign In' : 'Sign Up'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <View style={[styles.line, { backgroundColor: themeColors.border }]} />
                            <Text style={[styles.dividerText, { color: themeColors.textMuted }]}>or</Text>
                            <View style={[styles.line, { backgroundColor: themeColors.border }]} />
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={[styles.socialButton, { borderColor: themeColors.primary }]}
                            onPress={handleGoogleSignIn}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={themeColors.primary} />
                            ) : (
                                <>
                                    <Ionicons name="logo-google" size={20} color={themeColors.primary} style={{ marginRight: 10 }} />
                                    <Text style={[styles.socialButtonText, { color: themeColors.primary }]}>Continue with Google</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                                setSuccess(null);
                            }}
                            style={styles.switchAuth}
                        >
                            <Text style={[styles.switchAuthText, { color: themeColors.textMuted }]}>
                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                                <Text style={[styles.switchAuthLink, { color: themeColors.primary }]}>
                                    {isLogin ? 'Sign Up' : 'Sign In'}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    loginCard: {
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 28,
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: Fonts.body,
        fontSize: 16,
        marginBottom: 32,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    input: {
        height: 56,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontFamily: Fonts.body,
        fontSize: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    forgotPassword: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    button: {
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    buttonText: {
        fontFamily: Fonts.heading,
        fontSize: 18,
        letterSpacing: 1,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    line: {
        flex: 1,
        height: 1,
        opacity: 0.5,
    },
    dividerText: {
        paddingHorizontal: 16,
        fontFamily: Fonts.body,
        fontSize: 14,
        opacity: 0.5,
    },
    socialButton: {
        height: 56,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    socialButtonText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
    },
    switchAuth: {
        alignItems: 'center',
    },
    switchAuthText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        opacity: 0.8,
    },
    switchAuthLink: {
        fontFamily: Fonts.bodyBold,
    },
    errorBox: {
        padding: 12,
        borderWidth: 1,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        marginBottom: 24,
    },
    errorText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        textAlign: 'center',
    },
    successBox: {
        padding: 12,
        borderWidth: 1,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        marginBottom: 24,
    },
    successText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        textAlign: 'center',
    },
});
