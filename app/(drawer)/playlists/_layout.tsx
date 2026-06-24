import { Stack } from 'expo-router';

/**
 * Playlists stack - list (index) and detail ([id]).
 */
export default function PlaylistsLayout() {
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
