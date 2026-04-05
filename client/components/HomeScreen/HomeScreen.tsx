import { Colors } from '@/constants/theme';
import React, { useRef } from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NAVBAR_HEIGHT } from '../Navbar';
import { ActionSection } from './ActionSection';
import { FeaturePreviewSection } from './FeaturePreviewSection';
import { HeroSection } from './HeroSection';

interface HomeScreenProps {
    onLogin: () => void;
    onSignup: () => void;
    hideNavbarSpace?: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onLogin, onSignup, hideNavbarSpace = false }) => {
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);

    const handleExplorePress = () => {
        scrollRef.current?.scrollTo({ y: 760, animated: true });
    };

    const topGap = hideNavbarSpace ? 24 : NAVBAR_HEIGHT + 18;

    return (
        <View style={[styles.container, { backgroundColor: Colors.light.background }]}> 
            <StatusBar barStyle="dark-content" />
            <View style={styles.sunGlow} />
            <View style={styles.paperStrip} />

            <ScrollView
                ref={scrollRef}
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + topGap },
                ]}
            >
                <HeroSection />
                <ActionSection 
                    onExplorePress={handleExplorePress} 
                    onLogin={onLogin}
                    onSignup={onSignup}
                />
                <FeaturePreviewSection />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 110,
    },
    sunGlow: {
        position: 'absolute',
        top: -110,
        right: -40,
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(212, 163, 115, 0.28)',
    },
    paperStrip: {
        position: 'absolute',
        top: 120,
        left: -60,
        width: 220,
        height: 120,
        backgroundColor: 'rgba(74, 103, 65, 0.08)',
        transform: [{ rotate: '-12deg' }],
    },
});