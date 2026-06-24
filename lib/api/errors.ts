import type { ApiError } from './client';

/**
 * Type guard for ApiError.
 * Use to narrow unknown errors in catch blocks.
 */
export function isApiError(error: unknown): error is ApiError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        'message' in error &&
        typeof (error as ApiError).message === 'string' &&
        [
            'NETWORK_ERROR',
            'UNAUTHORIZED',
            'CLIENT_ERROR',
            'SERVER_ERROR',
        ].includes((error as ApiError).code)
    );
}

/**
 * Returns a user-friendly message for any error.
 * Maps ApiError codes to readable messages; falls back to generic message for unknown errors.
 */
export function getUserFriendlyMessage(error: unknown): string {
    if (isApiError(error)) {
        switch (error.code) {
            case 'NETWORK_ERROR':
                return 'Unable to connect. Check your internet and try again.';
            case 'UNAUTHORIZED':
                return 'Session expired. Please sign in again.';
            case 'CLIENT_ERROR':
                return error.message;
            case 'SERVER_ERROR':
                return 'Something went wrong on our end. Please try again later.';
            default:
                return error.message;
        }
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred. Please try again.';
}

/**
 * Extracts ApiError code for conditional UI (e.g., show "Sign in again" for UNAUTHORIZED).
 */
export function getErrorCode(error: unknown): ApiError['code'] | null {
    if (isApiError(error)) {
        return error.code;
    }
    return null;
}
