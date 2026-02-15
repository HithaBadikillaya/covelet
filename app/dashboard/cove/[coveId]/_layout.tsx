import { Stack } from 'expo-router';
import React from 'react';

export default function CoveLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#ffffff', // MUST NOT be transparent
        },
        animation: 'fade_from_bottom',
      }}
    />
  );
}
