import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import {
    SkipBack,
    Play,
    Pause,
    SkipForward,
    Volume1,
    Volume2,
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDevice, useMediaSession, useSendMediaCommand } from '../../../lib/hooks';
import { Text } from '../../../components/ui/Text';
import { RemoteControlButton } from '../../../components/RemoteControlButton';
import { DRAWER_HEADER_HEIGHT } from '../../../lib/constants';
import { colors } from '../../../lib/theme/colors';
import { isImageUrl } from '../../../lib/utils/media';
import { mediaControlSocket } from '../../../lib/ws/media-control-socket';
import type { MediaSession } from '../../../lib/api/types';

const VOLUME_STEP = 0.1;

function getPreviewUri(session: MediaSession | null | undefined): string | null {
    if (session?.snapshotData) {
        return `data:image/jpeg;base64,${session.snapshotData}`;
    }
    if (session?.mediaUrl && isImageUrl(session.mediaUrl)) {
        return session.mediaUrl;
    }
    return null;
}

/**
 * Media control UI - remote-like layout with play/pause/seek/volume controls.
 */
export default function ControlScreen() {
    const insets = useSafeAreaInsets();
    const { deviceId: deviceIdParam } = useLocalSearchParams<{
        deviceId: string;
    }>();
    const contentTopPadding = insets.top + DRAWER_HEADER_HEIGHT + 24;

    const { data: device, isLoading, error } = useDevice(deviceIdParam);
    const sendCommand = useSendMediaCommand(device?.deviceId);
    const embeddedSession = device?.mediaSession;
    const { data: polledSession } = useMediaSession(device?.deviceId);
    const [liveSession, setLiveSession] = useState<MediaSession | null>(null);
    const [optimisticVolume, setOptimisticVolume] = useState<number | null>(null);

    const session = liveSession ?? polledSession ?? embeddedSession ?? null;
    const volume = optimisticVolume ?? session?.volume ?? 1;

    useEffect(() => {
        if (!device?.deviceId) return;

        void mediaControlSocket.connect(device.deviceId);
        const unsub = mediaControlSocket.onSessionState((next) => {
            setLiveSession(next);
            setOptimisticVolume(null);
        });

        return () => {
            unsub();
            mediaControlSocket.disconnect();
        };
    }, [device?.deviceId]);

    useEffect(() => {
        if (polledSession?.volume != null && optimisticVolume == null) {
            setLiveSession((prev) => ({ ...(prev ?? polledSession), ...polledSession }));
        }
    }, [polledSession, optimisticVolume]);

    if (isLoading) {
        return (
            <View
                className="flex-1 bg-base justify-center items-center"
                style={{ paddingTop: contentTopPadding }}
            >
                <ActivityIndicator size="large" color={colors.primaryHex} />
            </View>
        );
    }

    if (error || !device) {
        return (
            <View
                className="flex-1 bg-base justify-center items-center px-6"
                style={{ paddingTop: contentTopPadding }}
            >
                <Text className="text-zinc-400 text-center">
                    Device not found
                </Text>
            </View>
        );
    }

    const previewUri = getPreviewUri(session);
    const position = session?.position ?? 0;
    const duration = session?.duration ?? 0;

    const handlePlayPause = () => {
        if (!device?.deviceId) return;
        sendCommand.mutate({
            command: session?.playing ? 'pause' : 'play',
        });
    };

    const handleSeek = (nextPosition: number) => {
        if (!device?.deviceId) return;
        sendCommand.mutate({
            command: 'seek',
            payload: { position: Math.max(0, nextPosition) },
        });
    };

    const handleVolumeChange = (delta: number) => {
        if (!device?.deviceId) return;
        const nextVolume = Math.min(1, Math.max(0, volume + delta));
        setOptimisticVolume(nextVolume);
        if (mediaControlSocket.isConnected()) {
            mediaControlSocket.sendCommand({
                command: 'volume',
                payload: { volume: nextVolume },
            });
            return;
        }
        sendCommand.mutate({
            command: 'volume',
            payload: { volume: nextVolume },
        });
    };

    return (
        <View
            className="flex-1 bg-base"
            style={{ paddingTop: contentTopPadding }}
        >
            <View className="flex-1 px-6">
                <View className="rounded-2xl bg-zinc-800 overflow-hidden mb-6">
                    <View className="h-48 bg-zinc-700/60">
                        {previewUri ? (
                            <Image
                                source={{ uri: previewUri }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                            />
                        ) : (
                            <View className="flex-1 items-center justify-center">
                                <Ionicons
                                    name="play-circle-outline"
                                    size={64}
                                    color={colors.primaryHex}
                                />
                            </View>
                        )}
                    </View>
                </View>

                <Text className="text-xl font-sans-semibold text-white text-center mb-2">
                    {device.name}
                </Text>
                <Text className="text-zinc-400 text-center mb-8">
                    {session?.playing ? 'Playing' : 'Paused'}
                </Text>

                <View className="flex-row items-center justify-center gap-8 mt-4">
                    <RemoteControlButton
                        onPress={() => handleSeek(Math.max(0, position - 10))}
                        disabled={sendCommand.isPending}
                    >
                        <SkipBack size={28} color="#fff" />
                    </RemoteControlButton>
                    <RemoteControlButton
                        size="lg"
                        onPress={handlePlayPause}
                        disabled={sendCommand.isPending}
                    >
                        {session?.playing ? (
                            <Pause size={32} color="#fff" />
                        ) : (
                            <Play size={32} color="#fff" />
                        )}
                    </RemoteControlButton>
                    <RemoteControlButton
                        onPress={() =>
                            handleSeek(
                                duration > 0
                                    ? Math.min(duration, position + 10)
                                    : position + 10,
                            )
                        }
                        disabled={sendCommand.isPending}
                    >
                        <SkipForward size={28} color="#fff" />
                    </RemoteControlButton>
                </View>

                <View className="flex-row items-center justify-center gap-8 mt-4">
                    <RemoteControlButton onPress={() => handleVolumeChange(-VOLUME_STEP)}>
                        <Volume1 size={24} color="#fff" />
                    </RemoteControlButton>
                    <RemoteControlButton onPress={() => handleVolumeChange(VOLUME_STEP)}>
                        <Volume2 size={24} color="#fff" />
                    </RemoteControlButton>
                </View>
            </View>
        </View>
    );
}
