import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Alert,
  Stack,
  Paper,
  Chip,
} from '@mui/material';
import {
  IconUpload,
  IconX,
  IconFile,
  IconMusic,
  IconPhoto,
  IconVideo,
  IconFileText,
  IconCheck,
} from '@tabler/icons-react';
import storageService, { FileCategory, UploadResponse } from '../../api/services/storage.service';

interface FileUploadProps {
  /** Allowed file category */
  fileType: FileCategory;
  /** Prefix for storage path (e.g., 'covers', 'episodes') */
  prefix?: string;
  /** Callback when upload completes successfully */
  onUploadComplete?: (response: UploadResponse) => void;
  /** Callback when file is removed */
  onRemove?: () => void;
  /** Current file URL (for edit mode) */
  currentFileUrl?: string;
  /** Current file name */
  currentFileName?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Max file size in bytes (will use default for file type if not specified) */
  maxSize?: number;
}

// Default max sizes by file type
const DEFAULT_MAX_SIZES: Record<FileCategory, number> = {
  audio: 500 * 1024 * 1024,    // 500MB
  image: 5 * 1024 * 1024,      // 5MB
  video: 1024 * 1024 * 1024,   // 1GB
  document: 10 * 1024 * 1024,  // 10MB
};

// Accepted file extensions by type
const ACCEPTED_EXTENSIONS: Record<FileCategory, string> = {
  audio: '.mp3,.wav,.m4a,.aac,.ogg,.flac',
  image: '.jpg,.jpeg,.png,.webp,.gif',
  video: '.mp4,.webm,.mkv,.avi,.mov',
  document: '.pdf,.txt',
};

// Icons by file type
const FILE_ICONS: Record<FileCategory, React.ReactNode> = {
  audio: <IconMusic size={24} />,
  image: <IconPhoto size={24} />,
  video: <IconVideo size={24} />,
  document: <IconFileText size={24} />,
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileUpload: React.FC<FileUploadProps> = ({
  fileType,
  prefix,
  onUploadComplete,
  onRemove,
  currentFileUrl,
  currentFileName,
  disabled = false,
  label,
  helperText,
  maxSize,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    url: string;
    size?: number;
  } | null>(
    currentFileUrl
      ? { name: currentFileName || 'Current file', url: currentFileUrl }
      : null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxFileSize = maxSize || DEFAULT_MAX_SIZES[fileType];

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds maximum allowed (${formatFileSize(maxFileSize)})`;
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const acceptedExtensions = ACCEPTED_EXTENSIONS[fileType].split(',');
    if (!acceptedExtensions.includes(extension)) {
      return `Invalid file type. Accepted: ${acceptedExtensions.join(', ')}`;
    }

    return null;
  };

  const handleUpload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setUploading(true);
      setProgress(0);

      try {
        const response = await storageService.upload(file, {
          prefix,
          fileType,
          onProgress: setProgress,
        });

        setUploadedFile({
          name: file.name,
          url: response.url,
          size: response.sizeBytes,
        });

        onUploadComplete?.(response);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Upload failed. Please try again.');
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [fileType, prefix, onUploadComplete, maxFileSize]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  }, [disabled, uploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled || uploading) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleUpload(files[0]);
      }
    },
    [disabled, uploading, handleUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleUpload(files[0]);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleUpload]
  );

  const handleRemove = useCallback(() => {
    setUploadedFile(null);
    setError(null);
    onRemove?.();
  }, [onRemove]);

  const handleClick = useCallback(() => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, uploading]);

  return (
    <Box>
      {label && (
        <Typography variant="subtitle2" fontWeight={600} mb={1}>
          {label}
        </Typography>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS[fileType]}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || uploading}
      />

      {uploadedFile ? (
        // Uploaded file preview
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            bgcolor: 'success.lighter',
            borderColor: 'success.main',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1,
                bgcolor: 'success.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'success.dark',
              }}
            >
              {FILE_ICONS[fileType]}
            </Box>
            <Box flex={1}>
              <Typography variant="subtitle2" noWrap>
                {uploadedFile.name}
              </Typography>
              {uploadedFile.size && (
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(uploadedFile.size)}
                </Typography>
              )}
            </Box>
            <Chip
              icon={<IconCheck size={14} />}
              label="Uploaded"
              size="small"
              color="success"
            />
            {!disabled && (
              <IconButton
                size="small"
                onClick={handleRemove}
                sx={{ color: 'text.secondary' }}
              >
                <IconX size={18} />
              </IconButton>
            )}
          </Stack>
        </Paper>
      ) : (
        // Upload dropzone
        <Paper
          variant="outlined"
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            p: 4,
            textAlign: 'center',
            cursor: disabled || uploading ? 'default' : 'pointer',
            borderStyle: 'dashed',
            borderWidth: 2,
            borderColor: isDragging
              ? 'primary.main'
              : error
              ? 'error.main'
              : 'divider',
            bgcolor: isDragging
              ? 'primary.lighter'
              : disabled
              ? 'action.disabledBackground'
              : 'background.paper',
            transition: 'all 0.2s ease',
            '&:hover': !disabled && !uploading
              ? {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.lighter',
                }
              : {},
          }}
        >
          {uploading ? (
            <Stack spacing={2} alignItems="center">
              <Box sx={{ width: '100%', maxWidth: 300 }}>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Uploading... {progress}%
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  bgcolor: 'primary.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'primary.main',
                  mb: 1,
                }}
              >
                <IconUpload size={28} />
              </Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {isDragging ? 'Drop file here' : 'Click to upload or drag and drop'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {ACCEPTED_EXTENSIONS[fileType].replace(/\./g, '').replace(/,/g, ', ').toUpperCase()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Max size: {formatFileSize(maxFileSize)}
              </Typography>
            </Stack>
          )}
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {helperText && !error && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default FileUpload;
