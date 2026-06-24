import type { ApiError } from './client';

type NetworkErrorCallback = (error: ApiError) => void;

const networkErrorListeners: Set<NetworkErrorCallback> = new Set();

/**
 * Subscribe to network errors emitted by the API client.
 * Used by the global NetworkErrorHandler to show user feedback.
 */
export function onNetworkError(callback: NetworkErrorCallback): () => void {
    networkErrorListeners.add(callback);
    return () => networkErrorListeners.delete(callback);
}

/**
 * Emits a network error to all subscribers.
 * Called from the API client response interceptor.
 */
export function emitNetworkError(error: ApiError): void {
    networkErrorListeners.forEach((cb) => {
        try {
            cb(error);
        } catch {
            // Ignore listener errors
        }
    });
}
