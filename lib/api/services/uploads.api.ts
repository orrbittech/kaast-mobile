import { apiClient } from '../client';

export interface SignedUploadResponse {
    uploadUrl: string;
    publicUrl: string;
    objectKey: string;
    expiresIn: number;
    mediaType: 'image' | 'video' | 'audio';
}

export const uploadsApi = {
    getSignedUrl: async (body: {
        filename: string;
        mimeType: string;
        sizeBytes: number;
    }): Promise<SignedUploadResponse> => {
        const { data } = await apiClient.post<SignedUploadResponse>(
            '/uploads/signed-url',
            body,
        );
        return data;
    },
};
