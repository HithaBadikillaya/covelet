import { Stack } from 'expo-router';

export default function CoveLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
                animation: 'fade_from_bottom',
            }}
        />
    );
}
