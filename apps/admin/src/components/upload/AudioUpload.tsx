import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Alert,
  Stack,
  Paper,
  Slider,
} from '@mui/material';
import {
  IconUpload,
  IconX,
  IconPlayerPlay,
  IconPlayerPause,
  IconMusic,
  IconPlayerStop,
} from '@tabler/icons-react';
import storageService, { UploadResponse } from '../../api/services/storage.service';

interface AudioUploadProps {
  /** Prefix for storage path */
  prefix?: string;
  /** Callback when upload completes */
  onUploadComplete?: (response: UploadResponse) => void;
  /** Callback when audio duration is detected */
  onDurationChange?: (duration: number) => void;
  /** Callback when file is removed */
  onRemove?: () => void;
  /** Current audio URL */
  currentAudioUrl?: string;
  /** Current file name */
  currentFileName?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Label */
  label?: string;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AudioUpload: React.FC<AudioUploadProps> = ({
  prefix = 'episodes',
  onUploadComplete,
  onDurationChange,
  onRemove,
  currentAudioUrl,
  currentFileName,
  disabled = false,
  label = 'Audio File',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<{
    name: string;
    url: string;
    size?: number;
    duration?: number;
  } | null>(
    currentAudioUrl
      ? { name: currentFileName || 'Current audio', url: currentAudioUrl }
      : null
  );

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const MAX_SIZE = 500 * 1024 * 1024; // 500MB
  const ACCEPTED = '.mp3,.wav,.m4a,.aac,.ogg,.flac';

  // Load duration when audio URL changes
  useEffect(() => {
    if (audioFile?.url && audioRef.current) {
      audioRef.current.src = audioFile.url;
      audioRef.current.load();
    }
  }, [audioFile?.url]);

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      setDuration(dur);
      if (!audioFile?.duration) {
        setAudioFile((prev) => prev ? { ...prev, duration: dur } : null);
        onDurationChange?.(Math.floor(dur));
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (_: Event, value: number | number[]) => {
    const newTime = value as number;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_SIZE) {
      return `File size exceeds maximum allowed (${formatFileSize(MAX_SIZE)})`;
    }
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED.split(',').includes(extension)) {
      return 'Invalid file type. Accepted: MP3, WAV, M4A, AAC, OGG, FLAC';
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

    // Create abort controller for this upload
    abortControllerRef.current = new AbortController();

    try {
      // Get audio duration before upload
      const audioDuration = await new Promise<number>((resolve) => {
        const audio = new Audio();
        audio.onloadedmetadata = () => resolve(audio.duration);
        audio.onerror = () => resolve(0);
        audio.src = URL.createObjectURL(file);
      });

      const response = await storageService.upload(file, {
        prefix,
        fileType: 'audio',
        onProgress: setProgress,
        abortController: abortControllerRef.current,
      });

      setAudioFile({
        name: file.name,
        url: response.url,
        size: response.sizeBytes,
        duration: audioDuration,
      });

      if (audioDuration > 0) {
        onDurationChange?.(Math.floor(audioDuration));
      }

      onUploadComplete?.(response);
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        setError('Upload cancelled');
      } else {
        setError(err.response?.data?.message || 'Upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
      setProgress(0);
      abortControllerRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setAudioFile(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
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

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onLoadedMetadata={handleAudioLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
      />

      {audioFile ? (
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.lighter', borderColor: 'primary.main' }}>
          <Stack spacing={2}>
            {/* File info */}
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1,
                  bgcolor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'primary.dark',
                }}
              >
                <IconMusic size={24} />
              </Box>
              <Box flex={1}>
                <Typography variant="subtitle2" noWrap>
                  {audioFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {audioFile.size ? formatFileSize(audioFile.size) : ''}
                  {audioFile.size && audioFile.duration ? ' • ' : ''}
                  {audioFile.duration ? formatTime(audioFile.duration) : ''}
                </Typography>
              </Box>
              {!disabled && (
                <IconButton size="small" onClick={handleRemove} sx={{ color: 'text.secondary' }}>
                  <IconX size={18} />
                </IconButton>
              )}
            </Stack>

            {/* Audio player */}
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton
                onClick={togglePlay}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                {isPlaying ? <IconPlayerPause size={20} /> : <IconPlayerPlay size={20} />}
              </IconButton>
              <Typography variant="caption" sx={{ minWidth: 45 }}>
                {formatTime(currentTime)}
              </Typography>
              <Slider
                size="small"
                value={currentTime}
                max={duration || 100}
                onChange={handleSeek}
                sx={{ flex: 1 }}
              />
              <Typography variant="caption" sx={{ minWidth: 45 }}>
                {formatTime(duration)}
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      ) : (
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
            borderColor: isDragging ? 'primary.main' : error ? 'error.main' : 'divider',
            bgcolor: isDragging ? 'primary.lighter' : disabled ? 'action.disabledBackground' : 'background.paper',
            transition: 'all 0.2s ease',
            '&:hover': !disabled && !uploading ? { borderColor: 'primary.main', bgcolor: 'primary.lighter' } : {},
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
              <IconButton
                size="small"
                onClick={handleCancelUpload}
                sx={{ color: 'error.main' }}
              >
                <IconPlayerStop size={20} />
              </IconButton>
              <Typography variant="caption" color="text.secondary">
                Click to cancel
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
                {isDragging ? 'Drop audio file here' : 'Click to upload audio'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                MP3, WAV, M4A, AAC, OGG, FLAC
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Max size: 500MB
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
    </Box>
  );
};

export default AudioUpload;
