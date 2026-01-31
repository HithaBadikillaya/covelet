import { Colors } from '@/constants/theme';
import React, { useRef } from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NAVBAR_HEIGHT } from '../Navbar';
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
                    { paddingTop: insets.top + NAVBAR_HEIGHT + 20 }
                ]}
            >
                <HeroSection />
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
