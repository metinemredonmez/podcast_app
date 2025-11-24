import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Alert,
  Stack,
  Paper,
} from '@mui/material';
import {
  IconUpload,
  IconX,
  IconPhoto,
} from '@tabler/icons-react';
import storageService, { UploadResponse } from '../../api/services/storage.service';

interface ImageUploadProps {
  /** Prefix for storage path */
  prefix?: string;
  /** Callback when upload completes */
  onUploadComplete?: (response: UploadResponse) => void;
  /** Callback when image is removed */
  onRemove?: () => void;
  /** Current image URL */
  currentImageUrl?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Label */
  label?: string;
  /** Aspect ratio for preview */
  aspectRatio?: '1:1' | '16:9' | '4:3';
  /** Preview width */
  previewWidth?: number;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ASPECT_RATIOS = {
  '1:1': 1,
  '16:9': 16 / 9,
  '4:3': 4 / 3,
};

const ImageUpload: React.FC<ImageUploadProps> = ({
  prefix = 'covers',
  onUploadComplete,
  onRemove,
  currentImageUrl,
  disabled = false,
  label = 'Cover Image',
  aspectRatio = '1:1',
  previewWidth = 200,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(currentImageUrl || null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ACCEPTED = '.jpg,.jpeg,.png,.webp,.gif';

  const previewHeight = previewWidth / ASPECT_RATIOS[aspectRatio];

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_SIZE) {
      return `File size exceeds maximum allowed (${formatFileSize(MAX_SIZE)})`;
    }
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED.split(',').includes(extension)) {
      return 'Invalid file type. Accepted: JPG, PNG, WebP, GIF';
    }
    return null;
  };

  const handleUpload = async (file: File) => {
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
        fileType: 'image',
        onProgress: setProgress,
      });

      setImageUrl(response.url);
      onUploadComplete?.(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || uploading) return;
    const files = e.dataTransfer.files;
    if (files.length > 0) handleUpload(files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleUpload(files[0]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = () => {
    setImageUrl(null);
    setError(null);
    onRemove?.();
  };

  const handleClick = () => {
    if (!disabled && !uploading) fileInputRef.current?.click();
  };

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} mb={1}>
        {label}
      </Typography>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || uploading}
      />

      {imageUrl ? (
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <Paper
            variant="outlined"
            sx={{
              width: previewWidth,
              height: previewHeight,
              overflow: 'hidden',
              borderRadius: 2,
            }}
          >
            <Box
              component="img"
              src={imageUrl}
              alt="Preview"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </Paper>
          {!disabled && (
            <IconButton
              size="small"
              onClick={handleRemove}
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                bgcolor: 'error.main',
                color: 'white',
                '&:hover': { bgcolor: 'error.dark' },
              }}
            >
              <IconX size={16} />
            </IconButton>
          )}
          {/* Change image overlay */}
          {!disabled && (
            <Box
              onClick={handleClick}
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: 'white',
                py: 1,
                textAlign: 'center',
                cursor: 'pointer',
                opacity: 0,
                transition: 'opacity 0.2s',
                '&:hover': { opacity: 1 },
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 8,
              }}
            >
              <Typography variant="caption">Change Image</Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Paper
          variant="outlined"
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            width: previewWidth,
            height: previewHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled || uploading ? 'default' : 'pointer',
            borderStyle: 'dashed',
            borderWidth: 2,
            borderColor: isDragging ? 'primary.main' : error ? 'error.main' : 'divider',
            bgcolor: isDragging ? 'primary.lighter' : disabled ? 'action.disabledBackground' : 'background.paper',
            borderRadius: 2,
            transition: 'all 0.2s ease',
            '&:hover': !disabled && !uploading ? { borderColor: 'primary.main', bgcolor: 'primary.lighter' } : {},
          }}
        >
          {uploading ? (
            <Stack spacing={1} alignItems="center" sx={{ width: '80%' }}>
              <LinearProgress variant="determinate" value={progress} sx={{ width: '100%' }} />
              <Typography variant="caption" color="text.secondary">
                {progress}%
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={1} alignItems="center">
              <IconPhoto size={32} color="#9e9e9e" />
              <Typography variant="caption" color="text.secondary" align="center">
                {isDragging ? 'Drop here' : 'Click or drag'}
              </Typography>
            </Stack>
          )}
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 1, maxWidth: previewWidth }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        JPG, PNG, WebP, GIF • Max 5MB
      </Typography>
    </Box>
  );
};

export default ImageUpload;
