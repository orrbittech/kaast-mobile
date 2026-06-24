import { Modal, Pressable, View } from 'react-native';
import { Text } from './ui/Text';

export interface ConfirmModalProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmStyle?: 'destructive' | 'default';
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
}

/**
 * Shared native-style confirmation modal for delete/remove actions.
 * Matches iOS alert style: centered dialog, title, message, Cancel/Confirm buttons.
 */
export function ConfirmModal({
    visible,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmStyle = 'destructive',
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <Pressable
                className="flex-1 bg-black/60 justify-center items-center px-6"
                onPress={onCancel}
            >
                <Pressable
                    className="w-full max-w-sm rounded-2xl bg-zinc-800 p-6"
                    onPress={(e) => e.stopPropagation()}
                >
                    <Text className="text-lg font-sans-semibold text-white mb-2">
                        {title}
                    </Text>
                    <Text className="text-zinc-400 text-base mb-6">
                        {message}
                    </Text>
                    <View className="flex-row gap-3">
                        <Pressable
                            onPress={onCancel}
                            className="flex-1 py-3 rounded-xl items-center active:opacity-90"
                        >
                            <Text className="font-sans-medium text-blue-400">
                                {cancelText}
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={async () => {
                                await onConfirm();
                            }}
                            className={`flex-1 py-3 rounded-xl items-center active:opacity-90 ${
                                confirmStyle === 'destructive'
                                    ? 'bg-primary'
                                    : 'bg-zinc-700'
                            }`}
                        >
                            <Text
                                className={`font-sans-medium ${
                                    confirmStyle === 'destructive'
                                        ? 'text-white'
                                        : 'text-white'
                                }`}
                            >
                                {confirmText}
                            </Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
