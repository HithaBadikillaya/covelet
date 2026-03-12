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
                    Core Features Below
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
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    buttonSecondary: {
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        backgroundColor: 'transparent',
        borderRadius: 14,
        borderColor: 'rgba(0,0,0,0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
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
