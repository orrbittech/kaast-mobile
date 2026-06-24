import { uploadsApi } from '../api/services/uploads.api';

export interface UploadMediaResult {
    publicUrl: string;
    objectKey: string;
    mediaType: 'image' | 'video' | 'audio';
}

export async function uploadMediaFile(params: {
    uri: string;
    mimeType: string;
    filename: string;
    sizeBytes: number;
    onProgress?: (pct: number) => void;
}): Promise<UploadMediaResult> {
    const { uploadUrl, publicUrl, objectKey, mediaType } =
        await uploadsApi.getSignedUrl({
            filename: params.filename,
            mimeType: params.mimeType,
            sizeBytes: params.sizeBytes,
        });

    const response = await fetch(params.uri);
    const blob = await response.blob();

    await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', params.mimeType);
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && params.onProgress) {
                params.onProgress(event.loaded / event.total);
            }
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
            }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(blob);
    });

    return { publicUrl, objectKey, mediaType };
}
