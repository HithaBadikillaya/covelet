import { Colors, Fonts, Layout } from "@/constants/theme";
import { router, Stack } from "expo-router";
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

import {
  resetPassword as authResetPassword,
  signIn,
  signUp,
} from "@/components/auth/authService";

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name.trim())) {
      setError(
        isLogin
          ? "Please enter both email and password."
          : "Please enter your name, email, and password.",
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(name, email, password);
      }
      router.replace("/");
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
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.loginCard}>
            <View style={styles.tapeStrip} />

            <Text style={styles.title}>
              {isLogin ? "WELCOME HOME" : "START YOUR STORY"}
            </Text>
            <Text style={styles.subtitle}>
              {isLogin
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

            {!isLogin ? (
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
              <TextInput
                style={styles.input}
                placeholder="********"
                placeholderTextColor={Colors.light.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {isLogin ? (
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPassword}>Forgot your password?</Text>
              </TouchableOpacity>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                loading && { opacity: 0.8 },
              ]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {isLogin ? "OPEN COVELET" : "CREATE ACCOUNT"}
                </Text>
              )}
            </Pressable>

            <TouchableOpacity
              onPress={() => {
                setIsLogin(!isLogin);
                setError(null);
                setSuccess(null);
              }}
              style={styles.switchAuth}
            >
              <View style={styles.switchAuthBox}>
                <Text style={styles.switchAuthText}>
                  {isLogin ? "New here? " : "Already have an account? "}
                </Text>
                <Text style={styles.switchAuthLink}>
                  {isLogin ? "Sign up" : "Sign in"}
                </Text>
              </View>
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
    backgroundColor: Colors.light.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  loginCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: Layout.radiusLarge,
    padding: 32,
    paddingTop: 48,
    borderWidth: 2,
    borderColor: Colors.light.text,
    shadowColor: "#000",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 10,
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
  buttonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    shadowOffset: { width: 2, height: 2 },
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
