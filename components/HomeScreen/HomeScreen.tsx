import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useRef } from 'react';
import { ImageBackground, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionSection } from './ActionSection';
import { FeaturePreviewSection } from './FeaturePreviewSection';
import { HeroSection } from './HeroSection';

export const HomeScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const scrollToFeatures = () => {
        scrollRef.current?.scrollTo({ y: 700, animated: true });
    };

    return (
        <ImageBackground
            source={require('@/assets/images/beach.jpg')}
            style={styles.container}
            resizeMode="cover"
        >
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            <View style={[
                styles.overlay,
                { backgroundColor: isDark ? 'rgba(26, 42, 56, 0.4)' : 'rgba(248, 251, 255, 0.3)' }
            ]}>
                <View style={[styles.safeArea, { paddingTop: insets.top }]}>
                    <ScrollView
                        ref={scrollRef}
                        style={styles.scroll}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <HeroSection />
                        <ActionSection onExplorePress={scrollToFeatures} />
                        <FeaturePreviewSection />
                    </ScrollView>
                </View>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 80, // Clear the Navbar
        paddingBottom: 60,
    },
});
