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
  Nunito_600SemiBold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
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
import { Stack, useRouter, useSegments, ErrorBoundary, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Navbar } from '@/components/Navbar';
import { TimeCapsuleNotificationBridge } from '@/components/notifications/TimeCapsuleNotificationBridge';
import { SplashScreen as CustomSplashScreen } from '@/components/SplashScreen/SplashScreen';
import { subscribeToAuthChanges } from '@/components/auth/authService';
import { User } from 'firebase/auth';
import { logger } from '@/utils/logger';

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary };

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [isSplashScreenVisible, setIsSplashScreenVisible] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthInitialised, setIsAuthInitialised] = useState(false);

  const segments = useSegments();
  const router = useRouter();

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

  const navigationState = useRootNavigationState();
  const isNavigationReady = navigationState?.key;

  useEffect(() => {
    try {
      const unsubscribe = subscribeToAuthChanges((u) => {
        logger.log('RootLayout: Auth state changed:', u?.uid || 'no user');
        setUser(u);
        setIsAuthInitialised(true);
      });
      return unsubscribe;
    } catch (e) {
      logger.error('Critical Auth Error:', e);
      setIsAuthInitialised(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthInitialised || !loaded || !isNavigationReady) return;

    try {
      const inAuthGroup = segments?.[0] === 'login';

      if (!user && !inAuthGroup) {
        router.replace('/login');
      } else if (user && inAuthGroup) {
        router.replace('/(tabs)');
      }
    } catch (e) {
      logger.error('Navigation Error:', e);
    }
  }, [user, isAuthInitialised, segments, loaded, router, isNavigationReady]);

  useEffect(() => {
    if (loaded || error) {
      logger.log('RootLayout: Fonts loaded/error, hiding native splash. Error:', error?.message || 'none');
      SplashScreen.hideAsync().catch(err => logger.warn('SplashScreen.hideAsync error:', err));
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  const isLoginPage = segments[0] === 'login';

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#FDFBF7' }}>
        <Stack screenOptions={{ headerShown: false }} initialRouteName="(tabs)">
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
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