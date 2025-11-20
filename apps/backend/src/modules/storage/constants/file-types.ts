export enum FileCategory {
  AUDIO = 'audio',
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

export interface FileTypeConfig {
  extensions: string[];
  mimeTypes: string[];
  maxSize: number; // in bytes
  magicNumbers?: { offset: number; bytes: number[] }[];
}

// File size limits
export const MAX_AUDIO_SIZE = 500 * 1024 * 1024; // 500MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_VIDEO_SIZE = 1024 * 1024 * 1024; // 1GB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

// Allowed file types configuration
export const ALLOWED_FILE_TYPES: Record<FileCategory, FileTypeConfig> = {
  [FileCategory.AUDIO]: {
    extensions: ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'],
    mimeTypes: [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/x-m4a',
      'audio/aac',
      'audio/ogg',
      'audio/flac',
    ],
    maxSize: MAX_AUDIO_SIZE,
    magicNumbers: [
      { offset: 0, bytes: [0xff, 0xfb] }, // MP3
      { offset: 0, bytes: [0xff, 0xf3] }, // MP3
      { offset: 0, bytes: [0xff, 0xf2] }, // MP3
      { offset: 0, bytes: [0x49, 0x44, 0x33] }, // MP3 (ID3)
      { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // WAV (RIFF)
      { offset: 0, bytes: [0x66, 0x74, 0x79, 0x70] }, // M4A (ftyp)
    ],
  },
  [FileCategory.IMAGE]: {
    extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    mimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ],
    maxSize: MAX_IMAGE_SIZE,
    magicNumbers: [
      { offset: 0, bytes: [0xff, 0xd8, 0xff] }, // JPEG
      { offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }, // PNG
      { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // WEBP (RIFF)
      { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF
    ],
  },
  [FileCategory.VIDEO]: {
    extensions: ['mp4', 'webm', 'mkv', 'avi', 'mov'],
    mimeTypes: [
      'video/mp4',
      'video/webm',
      'video/x-matroska',
      'video/avi',
      'video/quicktime',
    ],
    maxSize: MAX_VIDEO_SIZE,
    magicNumbers: [
      { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }, // MP4 (ftyp)
      { offset: 0, bytes: [0x1a, 0x45, 0xdf, 0xa3] }, // WEBM/MKV
    ],
  },
  [FileCategory.DOCUMENT]: {
    extensions: ['pdf', 'txt'],
    mimeTypes: [
      'application/pdf',
      'text/plain',
    ],
    maxSize: MAX_DOCUMENT_SIZE,
    magicNumbers: [
      { offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }, // PDF (%PDF)
    ],
  },
};

// Helper to get all allowed extensions
export const getAllAllowedExtensions = (): string[] => {
  return Object.values(ALLOWED_FILE_TYPES).flatMap((config) => config.extensions);
};

// Helper to get all allowed MIME types
export const getAllAllowedMimeTypes = (): string[] => {
  return Object.values(ALLOWED_FILE_TYPES).flatMap((config) => config.mimeTypes);
};

// Helper to detect file category by extension
export const detectFileCategoryByExtension = (filename: string): FileCategory | null => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return null;

  for (const [category, config] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (config.extensions.includes(ext)) {
      return category as FileCategory;
    }
  }
  return null;
};

// Helper to detect file category by MIME type
export const detectFileCategoryByMimeType = (mimeType: string): FileCategory | null => {
  for (const [category, config] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (config.mimeTypes.includes(mimeType.toLowerCase())) {
      return category as FileCategory;
    }
  }
  return null;
};
