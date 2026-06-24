import { useMutation } from '@tanstack/react-query';
import { mediaApi } from '../api/services/media.api';
import type { MediaCommand } from '../api/types';

export function useSendMediaCommand(deviceId: string | undefined) {
    return useMutation({
        mutationFn: (body: Omit<MediaCommand, 'deviceId'>) => {
            if (!deviceId) {
                return Promise.reject(new Error('Device ID required'));
            }
            return mediaApi.sendCommand({ deviceId, ...body });
        },
    });
}
