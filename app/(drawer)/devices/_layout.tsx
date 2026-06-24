import { Stack } from 'expo-router';

/**
 * Devices stack - list (index) and detail ([id]).
 */
export default function DevicesLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="[id]" />
        </Stack>
    );
}
