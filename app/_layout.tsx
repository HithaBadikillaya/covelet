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
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Navbar } from '@/components/Navbar';
import { TimeCapsuleNotificationBridge } from '@/components/notifications/TimeCapsuleNotificationBridge';
import { SplashScreen as CustomSplashScreen } from '@/components/SplashScreen/SplashScreen';
import { subscribeToAuthChanges } from '@/components/auth/authService';
import { User } from 'firebase/auth';

SplashScreen.preventAutoHideAsync();

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
  });

  useEffect(() => {
    try {
      const unsubscribe = subscribeToAuthChanges((u) => {
        setUser(u);
        setIsAuthInitialised(true);
      });
      return unsubscribe;
    } catch (e) {
      console.error('Critical Auth Error:', e);
      setIsAuthInitialised(true); // Don't block the app indefinitely
    }
  }, []);

  useEffect(() => {
    if (!isAuthInitialised || !loaded) return;

    try {
      const inAuthGroup = segments[0] === 'login';

      if (!user && !inAuthGroup) {
        router.replace('/login');
      } else if (user && inAuthGroup) {
        router.replace('/(tabs)');
      }
    } catch (e) {
      console.error('Navigation Error:', e);
    }
  }, [user, isAuthInitialised, segments, loaded, router]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  const isLoginPage = segments[0] === 'login';

  return (
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
  );
}