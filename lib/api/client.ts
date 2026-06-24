import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getClerkInstance } from '@clerk/clerk-expo';
import { emitNetworkError } from './networkEvents';
import { invalidateOnSignOut } from './invalidate';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/** Request timeout in milliseconds (30s) */
export const API_TIMEOUT_MS = 30_000;

/** Max retries for transient failures — React Query handles query retries */
const MAX_RETRIES = 0;

/** Custom config for retry tracking */
interface RetryableConfig extends InternalAxiosRequestConfig {
    _retryCount?: number;
}

/** Extended config for org-scoped requests (create/pair device, etc.) */
export interface ApiRequestConfig {
    /** Clerk org ID to include in JWT for org-scoped endpoints */
    clerkOrgId?: string;
}

/**
 * API client with Clerk token injection and error handling.
 * Use this instance for all backend requests.
 */
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT_MS,
    headers: {
        'Content-Type': 'application/json',
    },
    validateStatus: (status) => status >= 200 && status < 300,
});

/** Normalized API error for consistent handling */
export interface ApiError {
    message: string;
    code: 'NETWORK_ERROR' | 'UNAUTHORIZED' | 'CLIENT_ERROR' | 'SERVER_ERROR';
    status?: number;
    data?: unknown;
}

function toApiError(error: AxiosError): ApiError {
    if (error.response?.status === 401) {
        return {
            message: 'Session expired. Please sign in again.',
            code: 'UNAUTHORIZED',
            status: 401,
        };
    }
    if (error.code === 'ERR_NETWORK' || !error.response) {
        return {
            message: 'Network error. Please check your connection.',
            code: 'NETWORK_ERROR',
        };
    }
    const status = error.response.status;
    const data = error.response.data;
    let message = error.message;
    if (data && typeof data === 'object' && 'message' in data) {
        const msg = (data as { message?: string | string[] }).message;
        message = Array.isArray(msg)
            ? msg.join(', ')
            : String(msg ?? message);
    }
    return {
        message: message ?? `Request failed with status ${status}`,
        code: status >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR',
        status,
        data,
    };
}

/**
 * Request interceptor: injects Clerk Bearer token into requests.
 * When clerkOrgId is in config, fetches org-scoped token so JWT includes org claims.
 */
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig & ApiRequestConfig) => {
        try {
            const clerkInstance = getClerkInstance();
            const clerkOrgId = config.clerkOrgId;
            const token = clerkOrgId
                ? await clerkInstance.session?.getToken({ organizationId: clerkOrgId })
                : await clerkInstance.session?.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch {
            // No session or Clerk not ready - skip token; request may fail with 401
        }
        return config;
    },
    (error) => Promise.reject(error),
);

/**
 * Response interceptor: retries transient failures, emits errors to global handler,
 * handles 401 (sign out), and normalizes all errors.
 */
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const config = error.config as RetryableConfig | undefined;
        const retryCount = config?._retryCount ?? 0;
        const isTransient =
            error.code === 'ERR_NETWORK' ||
            !error.response ||
            (error.response.status >= 500 && error.response.status < 600);
        const canRetry = isTransient && retryCount < MAX_RETRIES && config;

        if (canRetry) {
            config._retryCount = retryCount + 1;
            const delayMs = 1000 * (retryCount + 1);
            await new Promise((r) => setTimeout(r, delayMs));
            return apiClient.request(config);
        }

        if (error.response?.status === 401) {
            invalidateOnSignOut();
            try {
                const clerkInstance = getClerkInstance();
                await clerkInstance.signOut();
            } catch {
                // Ignore signOut errors
            }
        }

        const apiError = toApiError(error);
        emitNetworkError(apiError);
        return Promise.reject(apiError);
    },
);

/**
 * Creates an AbortController for request cancellation.
 * Use with apiClient: apiClient.get(url, { signal: controller.signal })
 * React Query passes signal in queryFn: ({ signal }) => apiClient.get(url, { signal })
 */
export function createAbortController(): AbortController {
    return new AbortController();
}

export function getMediaSocketUrl(): string {
    return API_BASE_URL.replace(/\/$/, '');
}
