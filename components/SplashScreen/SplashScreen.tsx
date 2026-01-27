import { Image } from 'expo-image';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

interface SplashScreenProps {
    onAnimationComplete: () => void;
}

const { width, height } = Dimensions.get('window');

export const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // 1s fade-in, 1s delay, 1s fade-out
        Animated.sequence([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.delay(1000),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onAnimationComplete();
        });
    }, [fadeAnim, onAnimationComplete]);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                <Image
                    source={require('@/assets/images/icon.png')}
                    style={styles.logo}
                    contentFit="contain"
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#E6F4FE',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: width * 0.4,
        height: width * 0.4,
    },
});
