import apiClient from '../client';

export interface UploadResponse {
  key: string;
  url: string;
  bucket: string;
  expiresIn: number;
  sizeBytes?: number;
  mimeType?: string;
}

export interface SignedUrlResponse {
  url: string;
  expiresIn: number;
}

export interface DeleteResponse {
  success: boolean;
  key: string;
}

export type FileCategory = 'audio' | 'image' | 'video' | 'document';

export interface UploadOptions {
  prefix?: string;
  fileType?: FileCategory;
  expiresIn?: number;
  onProgress?: (progress: number) => void;
  abortController?: AbortController;
}

export const storageService = {
  /**
   * Upload a file to storage
   * Audio: mp3, wav, m4a, aac, ogg, flac (max 500MB)
   * Image: jpg, jpeg, png, webp, gif (max 5MB)
   * Video: mp4, webm, mkv, avi, mov (max 1GB)
   * Document: pdf, txt (max 10MB)
   */
  async upload(file: File, options: UploadOptions = {}): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const params = new URLSearchParams();
    if (options.prefix) params.append('prefix', options.prefix);
    if (options.fileType) params.append('fileType', options.fileType);
    if (options.expiresIn) params.append('expiresIn', options.expiresIn.toString());

    const queryString = params.toString();
    const url = `/storage/upload${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      signal: options.abortController?.signal,
      onUploadProgress: (progressEvent) => {
        if (options.onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress(progress);
        }
      },
    });

    return response.data;
  },

  /**
   * Get a signed URL for downloading a file
   */
  async getSignedUrl(key: string, expiresIn?: number): Promise<SignedUrlResponse> {
    const params = expiresIn ? { expiresIn } : {};
    const encodedKey = encodeURIComponent(key);
    const response = await apiClient.get(`/storage/file/${encodedKey}`, { params });
    return response.data;
  },

  /**
   * Delete a file from storage
   */
  async delete(key: string): Promise<DeleteResponse> {
    const encodedKey = encodeURIComponent(key);
    const response = await apiClient.delete(`/storage/file/${encodedKey}`);
    return response.data;
  },
};

export default storageService;
