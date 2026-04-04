import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors, Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const DEVELOPER_NAME = 'Hitha Badikillaya S U';
const GITHUB_URL = 'https://github.com/HithaBadikillaya/covelet';
const VERSION = Constants.expoConfig?.version || '1.0.0';

export default function AboutScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  const handleOpenGithub = () => {
    Linking.openURL(GITHUB_URL).catch(() => {
      Alert.alert('Error', 'Could not open GitHub link.');
    });
  };

  const checkForUpdates = async () => {
    setChecking(true);
    try {
      const response = await fetch('https://api.github.com/repos/HithaBadikillaya/covelet/releases/latest');
      const data = await response.json();
      
      const latestVersion = data.tag_name?.replace('v', '') || data.name?.replace('v', '');
      
      if (latestVersion && latestVersion !== VERSION) {
        Alert.alert(
          'Update Available',
          `A new version (${latestVersion}) is available! would you like to download the latest APK?`,
          [
            { text: 'Later', style: 'cancel' },
            { 
              text: 'Download', 
              onPress: () => Linking.openURL(`${GITHUB_URL}/releases`) 
            }
          ]
        );
      } else {
        Alert.alert('Up to Date', 'You are using the latest version of Covelet.');
      }
    } catch (error) {
      console.error('Update check failed:', error);
      Alert.alert('Error', 'Could not check for updates. Please check your internet connection.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: true, 
          title: 'About Covelet',
          headerTitleStyle: { fontFamily: Fonts.heading, color: Colors.light.primary },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
              <Ionicons name="arrow-back" size={24} color={Colors.light.primary} />
            </TouchableOpacity>
          )
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Image 
            source={require('@/assets/images/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>COVELET</Text>
          <Text style={styles.tagline}>Shared spaces for shared memories.</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Developer</Text>
            <Text style={styles.value}>{DEVELOPER_NAME}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.infoRow} onPress={handleOpenGithub}>
            <Text style={styles.label}>GitHub</Text>
            <View style={styles.linkValue}>
              <Text style={[styles.value, { color: Colors.light.primary }]}>Repository</Text>
              <Ionicons name="open-outline" size={16} color={Colors.light.primary} />
            </View>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Version</Text>
            <Text style={styles.value}>{VERSION}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.updateButton} 
          onPress={checkForUpdates}
          disabled={checking}
        >
          {checking ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
              <Text style={styles.updateButtonText}>Check for Updates</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Covelet Team</Text>
          <Text style={styles.footerText}>Built with ❤️ for digital heritage.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appName: {
    fontFamily: Fonts.heading,
    fontSize: 32,
    color: Colors.light.primary,
    letterSpacing: 2,
  },
  tagline: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.light.textMuted,
    marginTop: 4,
  },
  section: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Colors.light.border,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: Colors.light.text,
  },
  value: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.light.text,
  },
  linkValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    height: 2,
    backgroundColor: Colors.light.border,
  },
  updateButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 10,
    width: '100%',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.heading,
    fontSize: 16,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.light.textMuted,
  },
});
