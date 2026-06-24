import { useState } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './ui/Text';

interface MediaUploadPreviewProps {
    uri: string;
    mimeType: string;
    onClear: () => void;
}

function VideoPreview({ uri }: { uri: string }) {
    const player = useVideoPlayer(uri, (p) => {
        p.loop = true;
        p.muted = true;
    });

    return (
        <VideoView
            player={player}
            style={{ width: '100%', height: 160, borderRadius: 12 }}
            contentFit="contain"
            nativeControls
        />
    );
}

export function MediaUploadPreview({
    uri,
    mimeType,
    onClear,
}: MediaUploadPreviewProps) {
    const isVideo = mimeType.startsWith('video/');
    const isImage = mimeType.startsWith('image/');

    return (
        <View className="mb-4 rounded-xl bg-zinc-900 overflow-hidden">
            {isImage ? (
                <Image
                    source={{ uri }}
                    style={{ width: '100%', height: 160 }}
                    contentFit="cover"
                />
            ) : isVideo ? (
                <VideoPreview uri={uri} />
            ) : (
                <View className="h-24 items-center justify-center">
                    <Ionicons name="musical-notes" size={40} color="#a1a1aa" />
                    <Text className="text-zinc-400 text-sm mt-2">Audio file selected</Text>
                </View>
            )}
            <Pressable
                onPress={onClear}
                className="absolute top-2 right-2 bg-zinc-800 rounded-full p-2"
            >
                <Ionicons name="close" size={18} color="#ffffff" />
            </Pressable>
        </View>
    );
}

export function UploadProgressBar({ progress }: { progress: number }) {
    const pct = Math.round(progress * 100);
    return (
        <View className="mb-4">
            <View className="h-2 rounded-full bg-zinc-700 overflow-hidden">
                <View
                    className="h-full bg-approve"
                    style={{ width: `${pct}%` }}
                />
            </View>
            <Text className="text-zinc-400 text-xs mt-1">Uploading… {pct}%</Text>
        </View>
    );
}

export function PickMediaButtons({
    onPickGallery,
    onPickAudio,
    picking,
}: {
    onPickGallery: () => void;
    onPickAudio: () => void;
    picking: boolean;
}) {
    return (
        <View className="flex-row gap-2 mb-4">
            <Pressable
                onPress={onPickGallery}
                disabled={picking}
                className="flex-1 py-3 rounded-xl bg-zinc-700 items-center active:opacity-90 disabled:opacity-50"
            >
                {picking ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                    <Text className="font-sans-medium text-white text-sm">
                        Photo / Video
                    </Text>
                )}
            </Pressable>
            <Pressable
                onPress={onPickAudio}
                disabled={picking}
                className="flex-1 py-3 rounded-xl bg-zinc-700 items-center active:opacity-90 disabled:opacity-50"
            >
                <Text className="font-sans-medium text-white text-sm">Audio</Text>
            </Pressable>
        </View>
    );
}
