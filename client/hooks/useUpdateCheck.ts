import { useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import Constants from 'expo-constants';

const GITHUB_RELEASES = 'https://github.com/HithaBadikillaya/covelet/releases';
const API_URL = 'https://api.github.com/repos/HithaBadikillaya/covelet/releases/latest';

/**
 * Hook to check for app updates from GitHub releases.
 * Compares current version in app.json with latest release tag on GitHub.
 */
export function useAppUpdateCheck() {
  useEffect(() => {
    const check = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error('Github API response was not ok');
        }

        const data = await response.json();
        
        // Github releases usually use tags like 'v1.0.1' or names like '1.0.1'
        const latestVersion = data.tag_name?.replace('v', '') || data.name?.replace('v', '');
        const currentVersion = Constants.expoConfig?.version || '1.0.0';

        if (latestVersion && latestVersion !== currentVersion) {
          Alert.alert(
            'New Update Available',
            `A newer version (${latestVersion}) of Covelet is ready. Would you like to download the latest APK from GitHub?`,
            [
              { 
                text: 'Later', 
                style: 'cancel' 
              },
              { 
                text: 'Take Me There', 
                onPress: () => Linking.openURL(GITHUB_RELEASES) 
              }
            ],
            { cancelable: true }
          );
        }
      } catch (err) {
        // Silent failure - don't distract user if update check fails (no internet, etc)
        if (__DEV__) {
          console.log('[UpdateCheck] Silent check failed or no release found:', err);
        }
      }
    };

    // Delay slightly to ensure splash screen has hidden and UI is ready
    const timer = setTimeout(check, 4000);
    return () => clearTimeout(timer);
  }, []);
}
