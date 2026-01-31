import { Colors } from '@/constants/theme';
import React, { useRef } from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeroSection } from './HeroSection';

export const HomeScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);

    return (
        <View style={[styles.container, { backgroundColor: Colors.light.background }]}>
            <StatusBar barStyle="light-content" />

            <ScrollView
                ref={scrollRef}
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + 80 } // Padding for Navbar + spacing
                ]}
            >
                <HeroSection />
                {/* Space for CTAs will be in HeroSection or added here */}
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
        paddingBottom: 100,
    },
});
