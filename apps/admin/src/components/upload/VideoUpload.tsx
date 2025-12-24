import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Alert,
  Stack,
  Paper,
  TextField,
  Tabs,
  Tab,
  Slider,
} from '@mui/material';
import {
  IconUpload,
  IconX,
  IconPlayerPlay,
  IconPlayerPause,
  IconVideo,
  IconPlayerStop,
  IconBrandYoutube,
  IconLink,
} from '@tabler/icons-react';
import storageService, { UploadResponse } from '../../api/services/storage.service';

interface VideoUploadProps {
  prefix?: string;
  onUploadComplete?: (response: UploadResponse) => void;
  onDurationChange?: (duration: number) => void;
  onRemove?: () => void;
  onYoutubeUrlChange?: (url: string) => void;
  onExternalUrlChange?: (url: string) => void;
  currentVideoUrl?: string;
  currentYoutubeUrl?: string;
  currentExternalUrl?: string;
  currentFileName?: string;
  disabled?: boolean;
  label?: string;
}

type TabType = 'upload' | 'youtube' | 'external';

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

const extractYoutubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const extractDailymotionId = (url: string): string | null => {
  const match = url.match(/dailymotion\.com\/video\/([^_\n?#]+)/);
  return match ? match[1] : null;
};

const VideoUpload: React.FC<VideoUploadProps> = ({
  prefix = 'videos',
  onUploadComplete,
  onDurationChange,
  onRemove,
  onYoutubeUrlChange,
  onExternalUrlChange,
  currentVideoUrl,
  currentYoutubeUrl,
  currentExternalUrl,
  currentFileName,
  disabled = false,
  label = 'Video',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (currentYoutubeUrl) return 'youtube';
    if (currentExternalUrl) return 'external';
    return 'upload';
  });
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<{
    name: string;
    url: string;
    size?: number;
    duration?: number;
  } | null>(
    currentVideoUrl
      ? { name: currentFileName || 'Current video', url: currentVideoUrl }
      : null
  );
  const [youtubeUrl, setYoutubeUrl] = useState(currentYoutubeUrl || '');
  const [externalUrl, setExternalUrl] = useState(currentExternalUrl || '');

  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
  const ACCEPTED = '.mp4,.mov,.webm,.avi,.mkv';

  useEffect(() => {
    if (videoFile?.url && videoRef.current) {
      videoRef.current.src = videoFile.url;
      videoRef.current.load();
    }
  }, [videoFile?.url]);

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      if (!videoFile?.duration) {
        setVideoFile((prev) => prev ? { ...prev, duration: dur } : null);
        onDurationChange?.(Math.floor(dur));
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (_: Event, value: number | number[]) => {
    const newTime = value as number;
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_SIZE) {
      return `File size exceeds maximum allowed (${formatFileSize(MAX_SIZE)})`;
    }
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED.split(',').includes(extension)) {
      return 'Invalid file type. Accepted: MP4, MOV, WEBM, AVI, MKV';
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

    abortControllerRef.current = new AbortController();

    try {
      const videoDuration = await new Promise<number>((resolve) => {
        const video = document.createElement('video');
        video.onloadedmetadata = () => resolve(video.duration);
        video.onerror = () => resolve(0);
        video.src = URL.createObjectURL(file);
      });

      const response = await storageService.upload(file, {
        prefix,
        fileType: 'video',
        onProgress: setProgress,
        abortController: abortControllerRef.current,
      });

      setVideoFile({
        name: file.name,
        url: response.url,
        size: response.sizeBytes,
        duration: videoDuration,
      });

      if (videoDuration > 0) {
        onDurationChange?.(Math.floor(videoDuration));
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
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
    setVideoFile(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    setYoutubeUrl('');
    setExternalUrl('');
    onRemove?.();
  };

  const handleClick = () => {
    if (!disabled && !uploading) fileInputRef.current?.click();
  };

  const handleYoutubeUrlChange = (url: string) => {
    setYoutubeUrl(url);
    onYoutubeUrlChange?.(url);
  };

  const handleExternalUrlChange = (url: string) => {
    setExternalUrl(url);
    onExternalUrlChange?.(url);
  };

  const youtubeId = extractYoutubeId(youtubeUrl);
  const dailymotionId = extractDailymotionId(externalUrl);

  const renderUploadTab = () => {
    if (videoFile) {
      return (
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.lighter', borderColor: 'primary.main' }}>
          <Stack spacing={2}>
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
                <IconVideo size={24} />
              </Box>
              <Box flex={1}>
                <Typography variant="subtitle2" noWrap>
                  {videoFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {videoFile.size ? formatFileSize(videoFile.size) : ''}
                  {videoFile.size && videoFile.duration ? ' • ' : ''}
                  {videoFile.duration ? formatTime(videoFile.duration) : ''}
                </Typography>
              </Box>
              {!disabled && (
                <IconButton size="small" onClick={handleRemove} sx={{ color: 'text.secondary' }}>
                  <IconX size={18} />
                </IconButton>
              )}
            </Stack>

            {/* Video preview */}
            <Box sx={{ position: 'relative', borderRadius: 1, overflow: 'hidden', bgcolor: 'black' }}>
              <video
                ref={videoRef}
                onLoadedMetadata={handleVideoLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnded}
                style={{ width: '100%', maxHeight: 300, display: 'block' }}
              />
            </Box>

            {/* Video controls */}
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
      );
    }

    return (
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
            <IconButton size="small" onClick={handleCancelUpload} sx={{ color: 'error.main' }}>
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
              {isDragging ? 'Drop video file here' : 'Click to upload video'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              MP4, MOV, WEBM, AVI, MKV
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Max size: 2GB
            </Typography>
          </Stack>
        )}
      </Paper>
    );
  };

  const renderYoutubeTab = () => (
    <Stack spacing={2}>
      <TextField
        fullWidth
        label="YouTube URL"
        placeholder="https://youtube.com/watch?v=... veya https://youtu.be/..."
        value={youtubeUrl}
        onChange={(e) => handleYoutubeUrlChange(e.target.value)}
        disabled={disabled}
        InputProps={{
          startAdornment: <IconBrandYoutube size={20} style={{ marginRight: 8, color: '#FF0000' }} />,
        }}
        helperText="YouTube video linki yapıştırın"
      />
      {youtubeId && (
        <Box sx={{ borderRadius: 1, overflow: 'hidden', bgcolor: 'black' }}>
          <iframe
            width="100%"
            height="250"
            src={`https://www.youtube.com/embed/${youtubeId}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube video"
          />
        </Box>
      )}
    </Stack>
  );

  const renderExternalTab = () => (
    <Stack spacing={2}>
      <TextField
        fullWidth
        label="Harici Video URL"
        placeholder="https://dailymotion.com/video/... veya diğer video URL'si"
        value={externalUrl}
        onChange={(e) => handleExternalUrlChange(e.target.value)}
        disabled={disabled}
        InputProps={{
          startAdornment: <IconLink size={20} style={{ marginRight: 8 }} />,
        }}
        helperText="Dailymotion, Vimeo veya diğer video platformu linki"
      />
      {dailymotionId && (
        <Box sx={{ borderRadius: 1, overflow: 'hidden', bgcolor: 'black' }}>
          <iframe
            width="100%"
            height="250"
            src={`https://www.dailymotion.com/embed/video/${dailymotionId}`}
            frameBorder="0"
            allow="autoplay; fullscreen"
            allowFullScreen
            title="Dailymotion video"
          />
        </Box>
      )}
      {externalUrl && !dailymotionId && externalUrl.includes('vimeo') && (
        <Box sx={{ borderRadius: 1, overflow: 'hidden', bgcolor: 'black' }}>
          <iframe
            width="100%"
            height="250"
            src={externalUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
            frameBorder="0"
            allow="autoplay; fullscreen"
            allowFullScreen
            title="Vimeo video"
          />
        </Box>
      )}
    </Stack>
  );

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

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value as TabType)}
          variant="fullWidth"
        >
          <Tab
            icon={<IconUpload size={18} />}
            iconPosition="start"
            label="Dosya Yükle"
            value="upload"
            disabled={disabled}
          />
          <Tab
            icon={<IconBrandYoutube size={18} />}
            iconPosition="start"
            label="YouTube"
            value="youtube"
            disabled={disabled}
          />
          <Tab
            icon={<IconLink size={18} />}
            iconPosition="start"
            label="Harici URL"
            value="external"
            disabled={disabled}
          />
        </Tabs>
      </Box>

      {activeTab === 'upload' && renderUploadTab()}
      {activeTab === 'youtube' && renderYoutubeTab()}
      {activeTab === 'external' && renderExternalTab()}

      {error && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default VideoUpload;
