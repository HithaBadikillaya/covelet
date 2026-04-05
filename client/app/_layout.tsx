// WeakRef polyfill for Hermes JS engine (React Native / Expo)
// Firebase SDK uses WeakRef internally; Hermes older builds lack it.
if (typeof global.WeakRef === 'undefined') {
  (global as any).WeakRef = class WeakRef<T extends object> {
    private _target: T;
    constructor(target: T) { this._target = target; }
    deref(): T { return this._target; }
  };
}

import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Nunito_600SemiBold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { ErrorBoundary, Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth } from '@/components/auth/authService';
import { Navbar } from '@/components/Navbar';
import { TimeCapsuleNotificationBridge } from '@/components/notifications/TimeCapsuleNotificationBridge';
import { SplashScreen as CustomSplashScreen } from '@/components/SplashScreen/SplashScreen';
import { useAppUpdateCheck } from '@/hooks/useUpdateCheck';
import { setupNotifications } from '@/services/NotificationService';
import { logger } from '@/utils/logger';

// Prevent the native splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export { ErrorBoundary };

export const unstable_settings = {
  // Use login as the anchor so back navigation goes to the auth flow
  anchor: 'login',
};

/**
 * AuthGate: Handles all auth-based navigation redirects.
 * Kept separate from RootLayout to prevent layout-level re-render loops.
 */
function AuthGate() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isRedirecting = useRef(false);

  useEffect(() => {
    // Wait for auth to initialize
    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/';

    // 1. Not logged in and NOT on auth page → Go to Login
    if (!user && !isAuthPage) {
      if (isRedirecting.current) return;
      isRedirecting.current = true;
      logger.log('AuthGate: Redirecting to /login');
      router.replace('/login');
    }
    // 2. Logged in and on Login or root page → Go to Dashboard
    else if (user && isAuthPage) {
      if (isRedirecting.current) return;
      isRedirecting.current = true;
      logger.log('AuthGate: Redirecting to dashboard');
      router.replace('/(tabs)/dashboard');
    }
    // 3. Otherwise, we are stable
    else {
      isRedirecting.current = false;
    }
  }, [user, loading, pathname]);

  return null;
}

export default function RootLayout() {
  const [isSplashScreenVisible, setIsSplashScreenVisible] = useState(true);
  const pathname = usePathname();

  useAppUpdateCheck(); // Automatic update check on launch

  const [loaded, error] = useFonts({
    Nunito_800ExtraBold,
    Nunito_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  const { user } = useAuth(); // Keep for UI components like Navbar/TimeCapsule

  // Register FCM token on login for backend push notifications
  useEffect(() => {
    if (user?.uid) {
      setupNotifications(user.uid).catch((err: any) =>
        logger.warn('setupNotifications failed:', err)
      );
    }
  }, [user?.uid]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(err => logger.warn('SplashScreen.hideAsync error:', err));
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  const isLoginPage = pathname === '/login' || pathname === '/';

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#FDFBF7' }}>
        <AuthGate />

        <Stack screenOptions={{ headerShown: false }} initialRouteName="login">
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="about" />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>

        {user ? <TimeCapsuleNotificationBridge user={user} /> : null}
        {!isLoginPage && <Navbar />}
        <StatusBar style="dark" />

        {isSplashScreenVisible && (
          <CustomSplashScreen onAnimationComplete={() => setIsSplashScreenVisible(false)} />
        )}
      </View>
    </SafeAreaProvider>
  );
}
