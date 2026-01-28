import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ActionSectionProps {
    onExplorePress: () => void;
}

export const ActionSection: React.FC<ActionSectionProps> = ({ onExplorePress }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const themeColors = Colors[isDark ? 'dark' : 'light'];

    return (
        <View style={styles.container}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/dashboard')}
                style={[styles.button, { backgroundColor: themeColors.ocean }]}
            >
                <Text style={[styles.buttonText, { color: themeColors.white }]}>
                    Enter the Cove
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                activeOpacity={0.7}
                onPress={onExplorePress}
                style={[styles.buttonSecondary, { borderColor: themeColors.ocean }]}
            >
                <Text style={[styles.buttonTextSecondary, { color: themeColors.ocean }]}>
                    Invite to your Circle
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        gap: 16,
        marginTop: 64,
        paddingBottom: 40,
    },
    button: {
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
        // Sharp edges: 0 border radius
    },
    buttonSecondary: {
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        backgroundColor: 'transparent',
    },
    buttonText: {
        fontFamily: Fonts.heading,
        fontSize: 18,
        letterSpacing: 1,
    },
    buttonTextSecondary: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
    },
});
