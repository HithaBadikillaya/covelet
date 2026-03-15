import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { Outfit_400Regular, Outfit_700Bold, useFonts } from '@expo-google-fonts/outfit';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Navbar } from '@/components/Navbar';
import { SplashScreen as CustomSplashScreen } from '@/components/SplashScreen/SplashScreen';
import { subscribeToAuthChanges } from '@/components/auth/authService';
import { User } from 'firebase/auth';

// Keep the splash screen visible while we fetch resources
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
    Outfit_400Regular,
    Outfit_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  // Handle Auth changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((u) => {
      setUser(u);
      setIsAuthInitialised(true);
    });
    return unsubscribe;
  }, []);

  // Handle Redirects
  useEffect(() => {
    if (!isAuthInitialised || !loaded) return;

    const inAuthGroup = segments[0] === 'login';

    if (!user && !inAuthGroup) {
      // Redirect to login if user is not authenticated and not on login page
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // Redirect to dashboard if user is authenticated and on login page
      router.replace('/(tabs)/dashboard');
    }
  }, [user, isAuthInitialised, segments, loaded]);


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
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <Stack screenOptions={{ headerShown: false }} initialRouteName="(tabs)">
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      {!isLoginPage && <Navbar />}
      <StatusBar style="light" />
      {isSplashScreenVisible && (
        <CustomSplashScreen onAnimationComplete={() => setIsSplashScreenVisible(false)} />
      )}
    </View>
  );
}
