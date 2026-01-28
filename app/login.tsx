import { resetPassword, signIn, signUp } from '@/components/auth/authService';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    ImageBackground,
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
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const themeColors = Colors[isDark ? 'dark' : 'light'];

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
        <ImageBackground
            source={require('@/assets/images/beach.jpg')}
            style={styles.container}
            resizeMode="cover"
        >
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[
                styles.overlay,
                { backgroundColor: isDark ? 'rgba(26, 42, 56, 0.6)' : 'rgba(248, 251, 255, 0.4)' }
            ]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={[styles.loginCard, { backgroundColor: isDark ? 'rgba(26, 42, 56, 0.9)' : 'rgba(255, 255, 255, 0.9)' }]}>
                            <Text style={[styles.title, { color: themeColors.text }]}>
                                {isLogin ? 'Welcome back' : 'Create an Account'}
                            </Text>
                            <Text style={[styles.subtitle, { color: themeColors.text, opacity: 0.7 }]}>
                                {isLogin ? 'Enter your details to access your Coves.' : 'Join Covelet and start sharing memories.'}
                            </Text>

                            {error && (
                                <View style={[styles.errorBox, { borderColor: '#E6A495' }]}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                            {success && (
                                <View style={[styles.successBox, { borderColor: '#4ECDC4' }]}>
                                    <Text style={styles.successText}>{success}</Text>
                                </View>
                            )}

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: themeColors.text }]}>Email</Text>
                                <TextInput
                                    style={[styles.input, { borderColor: themeColors.sand, color: themeColors.text }]}
                                    placeholder="hello@example.com"
                                    placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: themeColors.text }]}>Password</Text>
                                <TextInput
                                    style={[styles.input, { borderColor: themeColors.sand, color: themeColors.text }]}
                                    placeholder="••••••••"
                                    placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            {isLogin && (
                                <TouchableOpacity onPress={handleForgotPassword}>
                                    <Text style={[styles.forgotPassword, { color: themeColors.ocean }]}>Forgot password?</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={[styles.button, { backgroundColor: themeColors.ocean }]}
                                onPress={handleAuth}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={themeColors.white} />
                                ) : (
                                    <Text style={[styles.buttonText, { color: themeColors.white }]}>
                                        {isLogin ? 'Sign In' : 'Sign Up'}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.divider}>
                                <View style={[styles.line, { backgroundColor: themeColors.sand }]} />
                                <Text style={[styles.dividerText, { color: themeColors.text }]}>or</Text>
                                <View style={[styles.line, { backgroundColor: themeColors.sand }]} />
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.7}
                                style={[styles.socialButton, { borderColor: themeColors.ocean }]}
                                onPress={handleGoogleSignIn}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={themeColors.ocean} />
                                ) : (
                                    <>
                                        <Ionicons name="logo-google" size={20} color={themeColors.ocean} style={{ marginRight: 10 }} />
                                        <Text style={[styles.socialButtonText, { color: themeColors.ocean }]}>Continue with Google</Text>
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
                                <Text style={[styles.switchAuthText, { color: themeColors.text }]}>
                                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                                    <Text style={{ fontFamily: Fonts.bodyBold, color: themeColors.ocean }}>
                                        {isLogin ? 'Sign Up' : 'Sign In'}
                                    </Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </ImageBackground>
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
    errorBox: {
        padding: 12,
        borderWidth: 1,
        backgroundColor: 'rgba(230, 164, 149, 0.1)',
        marginBottom: 24,
    },
    errorText: {
        color: '#E6A495',
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        textAlign: 'center',
    },
    successBox: {
        padding: 12,
        borderWidth: 1,
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        marginBottom: 24,
    },
    successText: {
        color: '#4ECDC4',
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        textAlign: 'center',
    },
});
