import { Colors, Fonts, Layout } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeScreen } from "@/components/HomeScreen/HomeScreen";

import {
  resetPassword as authResetPassword,
  signIn,
  signUp,
} from "@/components/auth/authService";


type AuthView = 'landing' | 'login' | 'signup';

export default function LoginScreen() {
  const [view, setView] = useState<AuthView>('landing');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAuth = async () => {
    if (!email || !password || (view === 'signup' && !name.trim())) {
      setError(
        view === 'login'
          ? "Please enter both email and password."
          : "Please enter your name, email, and password.",
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (view === 'login') {
        await signIn(email, password);
      } else {
        await signUp(name, email, password);
      }
      // Success is handled by AuthGate automatically
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authResetPassword(email);
      setSuccess(
        "Password reset link sent to your email. Check your inbox and spam folder.",
      );
    } catch (err: any) {
      setError(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
          {view === 'landing' ? (
            <HomeScreen onLogin={() => setView('login')} onSignup={() => setView('signup')} hideNavbarSpace={true} />
          ) : (
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.loginCard}>
              <TouchableOpacity 
                style={styles.backBtn} 
                onPress={() => {
                  setView('landing');
                  setError(null);
                  setSuccess(null);
                }}
              >
                <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
              </TouchableOpacity>

              <View style={styles.tapeStrip} />

              <Text style={styles.title}>
                {view === 'login' ? "WELCOME BACK" : "START YOUR STORY"}
              </Text>
              <Text style={styles.subtitle}>
                {view === 'login'
                  ? "Sign in to access your shared memories and coves."
                  : "Create an account to begin your journey with the people you love."}
              </Text>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {success ? (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>{success}</Text>
                </View>
              ) : null}

              {view === 'signup' ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>YOUR NAME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="How should everyone know you?"
                    placeholderTextColor={Colors.light.textMuted}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={Colors.light.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PASSWORD</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="********"
                    placeholderTextColor={Colors.light.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable
                    accessibilityLabel={
                      showPassword ? "Hide password" : "Show password"
                    }
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => setShowPassword((current) => !current)}
                    style={styles.passwordToggle}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={Colors.light.textMuted}
                    />
                  </Pressable>
                </View>
              </View>

              {view === 'login' ? (
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotPassword}>Forgot your password?</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.button,
                  loading && { opacity: 0.7 },
                ]}
                onPress={handleAuth}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>
                    {view === 'login' ? "OPEN COVELET" : "CREATE ACCOUNT"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setView(view === 'login' ? 'signup' : 'login');
                  setError(null);
                  setSuccess(null);
                }}
                style={styles.switchAuth}
              >
                <View style={styles.switchAuthBox}>
                  <Text style={styles.switchAuthText}>
                    {view === 'login' ? "New here? " : "Already have an account? "}
                  </Text>
                  <Text style={styles.switchAuthLink}>
                    {view === 'login' ? "Sign up" : "Sign in"}
                  </Text>
                </View>
              </TouchableOpacity>
              </View>
            </ScrollView>
          )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  // Form Styles
  loginCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: Layout.radiusLarge,
    padding: 32,
    paddingTop: 64,
    borderWidth: 2,
    borderColor: Colors.light.text,
    shadowColor: "#000",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 10,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapeStrip: {
    position: "absolute",
    top: -12,
    alignSelf: "center",
    width: 80,
    height: 24,
    backgroundColor: Colors.light.secondary,
    opacity: 0.6,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.light.textMuted,
    lineHeight: 20,
    marginBottom: 32,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    marginBottom: 8,
    color: Colors.light.text,
    letterSpacing: 0.5,
  },
  input: {
    height: 54,
    paddingHorizontal: 16,
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: "#FDFBF7",
    borderRadius: 0,
  },
  passwordInputContainer: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 48,
  },
  passwordToggle: {
    position: "absolute",
    right: 14,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  forgotPassword: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.light.primary,
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  button: {
    height: 56,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.light.text,
    borderRadius: Layout.radiusMedium,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 4,
  },
  buttonText: {
    fontFamily: Fonts.heading,
    fontSize: 15,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  switchAuth: {
    alignItems: "center",
  },
  switchAuthBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchAuthText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.light.textMuted,
  },
  switchAuthLink: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.light.primary,
    marginLeft: 4,
  },
  errorBox: {
    backgroundColor: "#FFF5F5",
    borderWidth: 1.5,
    borderColor: Colors.light.error,
    padding: 12,
    marginBottom: 24,
  },
  errorText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.light.error,
    textAlign: "center",
  },
  successBox: {
    backgroundColor: "#F0FFF4",
    borderWidth: 1.5,
    borderColor: "#48BB78",
    padding: 12,
    marginBottom: 24,
  },
  successText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: "#2F855A",
    textAlign: "center",
  },
});

