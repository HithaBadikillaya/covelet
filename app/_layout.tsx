import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { Outfit_400Regular, Outfit_700Bold, useFonts } from '@expo-google-fonts/outfit';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { Navbar } from '@/components/Navbar';
import { SplashScreen as CustomSplashScreen } from '@/components/SplashScreen/SplashScreen';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { subscribeToAuthChanges } from '@/backend/auth/authService';
import { User } from 'firebase/auth';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isSplashScreenVisible, setIsSplashScreenVisible] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [loaded, error] = useFonts({
    Outfit_400Regular,
    Outfit_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((u) => {
      setUser(u);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    if (!authLoading && !user) {
      // Redirect to login if on a protected route (simplified for now)
      // router.replace('/login'); // We handle this more carefully in the render or via segments
    }
  }, [user, authLoading]);

  if ((!loaded && !error) || authLoading) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <Navbar />
      </View>
      <StatusBar style="auto" />
      {isSplashScreenVisible && (
        <CustomSplashScreen onAnimationComplete={() => setIsSplashScreenVisible(false)} />
      )}
    </ThemeProvider>
  );
}
