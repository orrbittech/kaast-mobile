import { io, Socket } from 'socket.io-client';
import { getClerkInstance } from '@clerk/clerk-expo';
import { getMediaSocketUrl } from '../api/client';
import type { MediaCommand, MediaSession } from '../api/types';

const WS_NAMESPACE = '/media';

type SessionHandler = (session: MediaSession) => void;

class MediaControlSocketClient {
    private socket: Socket | null = null;
    private deviceId: string | null = null;
    private sessionHandler: SessionHandler | null = null;

    onSessionState(handler: SessionHandler): () => void {
        this.sessionHandler = handler;
        return () => {
            if (this.sessionHandler === handler) {
                this.sessionHandler = null;
            }
        };
    }

    async connect(deviceId: string): Promise<void> {
        if (this.socket?.connected && this.deviceId === deviceId) return;

        this.disconnect();

        const clerk = getClerkInstance();
        const token = await clerk.session?.getToken();
        if (!token) return;

        const url = getMediaSocketUrl();
        this.deviceId = deviceId;
        this.socket = io(`${url}${WS_NAMESPACE}`, {
            transports: ['websocket'],
            auth: { token },
            reconnection: true,
        });

        this.socket.on('connect', () => {
            this.socket?.emit('client:subscribe', { deviceId });
        });

        this.socket.on('session:state', (payload: MediaSession) => {
            if (!payload?.deviceId || payload.deviceId !== this.deviceId) return;
            this.sessionHandler?.(payload);
        });
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }
        this.deviceId = null;
    }

    sendCommand(command: Omit<MediaCommand, 'deviceId'>): void {
        if (!this.socket?.connected || !this.deviceId) return;
        this.socket.emit('control:command', {
            deviceId: this.deviceId,
            ...command,
        });
    }

    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }
}

export const mediaControlSocket = new MediaControlSocketClient();
