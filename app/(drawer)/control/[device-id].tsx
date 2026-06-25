import { useEffect, useMemo, useRef, useState } from 'react';
import { View, ActivityIndicator, Pressable, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import {
    SkipBack,
    Play,
    Pause,
    SkipForward,
    Volume1,
    Volume2,
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    useDevice,
    useMediaSession,
    useSendMediaCommand,
    usePlaylists,
    useLoadPlaylistOnDevice,
    useAssignedPlaylist,
    useActiveOrgContext,
} from '../../../lib/hooks';
import { Text } from '../../../components/ui/Text';
import { RemoteControlButton } from '../../../components/RemoteControlButton';
import { MediaCover } from '../../../components/MediaCover';
import { DRAWER_HEADER_HEIGHT } from '../../../lib/constants';
import { colors } from '../../../lib/theme/colors';
import {
    getDisplayTitle,
    getFirstItemCoverUrl,
    getSessionPreviewUri,
} from '../../../lib/utils/media';
import { mediaControlSocket } from '../../../lib/ws/media-control-socket';
import type { MediaSession, PlaylistItem } from '../../../lib/api/types';

const VOLUME_STEP = 0.1;

type LiveSessionState = Omit<MediaSession, 'snapshotData'>;

function toLiveSessionState(session: MediaSession): LiveSessionState {
    return {
        deviceId: session.deviceId,
        mediaUrl: session.mediaUrl,
        position: session.position,
        duration: session.duration,
        playing: session.playing,
        volume: session.volume,
        updatedAt: session.updatedAt,
    };
}

function getItemTitle(item: PlaylistItem): string {
    return getDisplayTitle({
        mediaUrl: item.mediaUrl,
        title: item.title ?? undefined,
    });
}

/**
 * Media control UI - remote-like layout with play/pause/seek/volume controls.
 */
export default function ControlScreen() {
    const insets = useSafeAreaInsets();
    const { 'device-id': deviceIdParam } = useLocalSearchParams<{
        'device-id': string;
    }>();
    const contentTopPadding = insets.top + DRAWER_HEADER_HEIGHT + 24;

    const { data: device, isLoading, error } = useDevice(deviceIdParam);
    const { clerkOrgId } = useActiveOrgContext();
    const { data: playlists } = usePlaylists(clerkOrgId ?? undefined);
    const { data: assignedPlaylist } = useAssignedPlaylist(device?.deviceId);
    const sendCommand = useSendMediaCommand(device?.deviceId);
    const loadPlaylist = useLoadPlaylistOnDevice(clerkOrgId ?? undefined);
    const embeddedSession = device?.mediaSession;
    const [liveSession, setLiveSession] = useState<LiveSessionState | null>(null);
    const [snapshotData, setSnapshotData] = useState<string | null>(null);
    const lastMediaUrlRef = useRef<string | null>(null);
    const { data: polledSession } = useMediaSession(device?.deviceId, {
        pollWhenDisconnected: liveSession == null,
    });
    const [optimisticVolume, setOptimisticVolume] = useState<number | null>(null);
    const [loadPlaylistModalVisible, setLoadPlaylistModalVisible] = useState(false);
    const [selectedLoadPlaylistId, setSelectedLoadPlaylistId] = useState<string | null>(null);

    const session = liveSession ?? polledSession ?? embeddedSession ?? null;
    const volume = optimisticVolume ?? session?.volume ?? 1;

    useEffect(() => {
        if (!device?.deviceId) return;

        void mediaControlSocket.connect(device.deviceId);
        const unsub = mediaControlSocket.onSessionState((next) => {
            const mediaUrl = next.mediaUrl ?? null;
            if (mediaUrl !== lastMediaUrlRef.current) {
                lastMediaUrlRef.current = mediaUrl;
                setSnapshotData(next.snapshotData ?? null);
            }
            setLiveSession(toLiveSessionState(next));
            setOptimisticVolume(null);
        });

        return () => {
            unsub();
            mediaControlSocket.disconnect();
            setLiveSession(null);
            setSnapshotData(null);
            lastMediaUrlRef.current = null;
        };
    }, [device?.deviceId]);

    useEffect(() => {
        if (polledSession?.volume != null && optimisticVolume == null) {
            setLiveSession((prev) => ({
                ...(prev ?? toLiveSessionState(polledSession)),
                ...toLiveSessionState(polledSession),
            }));
            if (polledSession.mediaUrl !== lastMediaUrlRef.current) {
                lastMediaUrlRef.current = polledSession.mediaUrl ?? null;
                setSnapshotData(polledSession.snapshotData ?? null);
            }
        }
    }, [polledSession, optimisticVolume]);

    useEffect(() => {
        if (!embeddedSession || liveSession) return;
        if (embeddedSession.snapshotData) {
            setSnapshotData(embeddedSession.snapshotData);
        }
        if (embeddedSession.mediaUrl) {
            lastMediaUrlRef.current = embeddedSession.mediaUrl;
        }
    }, [embeddedSession, liveSession]);

    const fallbackCoverUrl = getFirstItemCoverUrl(assignedPlaylist?.items);
    const previewMediaUrl = useMemo(
        () =>
            getSessionPreviewUri(session, snapshotData) ?? fallbackCoverUrl,
        [session, snapshotData, fallbackCoverUrl],
    );

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

    const openLoadPlaylistModal = () => {
        setSelectedLoadPlaylistId(device?.activePlaylistId ?? playlists?.[0]?.id ?? null);
        setLoadPlaylistModalVisible(true);
    };

    const handleLoadPlaylist = async () => {
        if (!device?.deviceId || !selectedLoadPlaylistId) return;
        const playlist = playlists?.find((p) => p.id === selectedLoadPlaylistId);
        if (!playlist) return;
        try {
            await loadPlaylist.mutateAsync({
                playlistId: playlist.id,
                deviceId: device.deviceId,
                deviceDbId: device.id,
                playlistName: playlist.name,
            });
            setLoadPlaylistModalVisible(false);
        } catch {
            // Global NetworkErrorHandler shows error
        }
    };

    return (
        <View
            className="flex-1 bg-base"
            style={{ paddingTop: contentTopPadding }}
        >
            <View className="flex-1 px-6">
                <View className="rounded-2xl bg-zinc-800 overflow-hidden mb-6">
                    <View className="h-48 bg-zinc-700/60 overflow-hidden">
                        <MediaCover mediaUrl={previewMediaUrl} fallbackSize="lg" />
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

                <Pressable
                    onPress={openLoadPlaylistModal}
                    disabled={!playlists?.length || loadPlaylist.isPending}
                    className="mt-8 flex-row items-center justify-center gap-2 py-3 rounded-xl bg-zinc-800 active:opacity-90 disabled:opacity-50"
                >
                    <Ionicons name="list-outline" size={20} color="#ffffff" />
                    <Text className="font-sans-medium text-white">
                        Load playlist
                    </Text>
                </Pressable>

                <View className="mt-6">
                    <Text className="text-zinc-400 text-sm font-sans-medium mb-2">
                        Loaded playlist
                    </Text>
                    {!assignedPlaylist ? (
                        <View className="rounded-xl bg-zinc-800 px-4 py-6 items-center">
                            <Text className="text-zinc-500 text-sm text-center">
                                No playlist loaded
                            </Text>
                        </View>
                    ) : (
                        <View className="rounded-xl bg-zinc-800 overflow-hidden">
                            <View className="px-4 py-3 border-b border-zinc-700">
                                <Text className="font-sans-semibold text-white">
                                    {assignedPlaylist.name}
                                </Text>
                                <Text className="text-zinc-400 text-sm mt-0.5">
                                    {assignedPlaylist.items?.length ?? 0}{' '}
                                    {(assignedPlaylist.items?.length ?? 0) === 1
                                        ? 'item'
                                        : 'items'}
                                </Text>
                            </View>
                            <ScrollView className="max-h-52">
                                {assignedPlaylist.items?.map((item, index) => {
                                    const isPlaying =
                                        !!session?.mediaUrl &&
                                        session.mediaUrl === item.mediaUrl;
                                    return (
                                        <View
                                            key={item.id}
                                            className={`flex-row items-center px-4 py-3 gap-3 ${
                                                index > 0 ? 'border-t border-zinc-700/60' : ''
                                            } ${isPlaying ? 'bg-zinc-700/40' : ''}`}
                                        >
                                            <View className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                                                <MediaCover
                                                    mediaUrl={item.mediaUrl}
                                                    fallbackSize="sm"
                                                />
                                            </View>
                                            <View className="flex-1">
                                                <Text
                                                    className={`font-sans-medium text-sm ${
                                                        isPlaying ? 'text-approve' : 'text-white'
                                                    }`}
                                                    numberOfLines={1}
                                                >
                                                    {getItemTitle(item)}
                                                </Text>
                                                {isPlaying && (
                                                    <Text className="text-approve text-xs mt-0.5">
                                                        Now playing
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </View>

            <Modal
                visible={loadPlaylistModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setLoadPlaylistModalVisible(false)}
            >
                <Pressable
                    className="flex-1 bg-black/60 justify-center items-center px-6"
                    onPress={() => setLoadPlaylistModalVisible(false)}
                >
                    <Pressable
                        className="w-full max-w-md rounded-2xl bg-zinc-800 p-6 max-h-[80%]"
                        onPress={(e) => e.stopPropagation()}
                    >
                        <Text className="text-lg font-sans-semibold text-white mb-2">
                            Load playlist
                        </Text>
                        <Text className="text-zinc-400 text-sm mb-4">
                            Starts playback on {device.name}.
                        </Text>
                        {!playlists?.length ? (
                            <Text className="text-zinc-400 text-center py-4 mb-4">
                                No playlists yet. Create one first.
                            </Text>
                        ) : (
                            <ScrollView className="max-h-48 mb-6">
                                <View className="flex-row flex-wrap gap-2">
                                    {playlists.map((p) => (
                                        <Pressable
                                            key={p.id}
                                            onPress={() => setSelectedLoadPlaylistId(p.id)}
                                            className={`px-3 py-2 rounded-lg ${
                                                selectedLoadPlaylistId === p.id
                                                    ? 'bg-approve'
                                                    : 'bg-zinc-700'
                                            }`}
                                        >
                                            <Text className="font-sans-medium text-white text-sm">
                                                {p.name}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </ScrollView>
                        )}
                        <View className="flex-row gap-3">
                            <Pressable
                                onPress={() => setLoadPlaylistModalVisible(false)}
                                className="flex-1 py-3 rounded-xl bg-zinc-700 items-center"
                            >
                                <Text className="font-sans-medium text-white">
                                    Cancel
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={handleLoadPlaylist}
                                disabled={
                                    !selectedLoadPlaylistId ||
                                    !playlists?.length ||
                                    loadPlaylist.isPending
                                }
                                className="flex-1 py-3 rounded-xl bg-approve items-center disabled:opacity-50"
                            >
                                {loadPlaylist.isPending ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text className="font-sans-medium text-white">
                                        Load & play
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}
