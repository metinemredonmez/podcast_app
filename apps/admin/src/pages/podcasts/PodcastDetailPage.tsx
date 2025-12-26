import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Slider,
  Paper,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconVolumeOff,
  IconClock,
  IconCalendar,
  IconUser,
  IconCategory,
  IconMusic,
  IconVideo,
  IconBrandYoutube,
} from '@tabler/icons-react';
import { podcastService, PodcastDetail } from '../../api/services/podcast.service';

const PodcastDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [podcast, setPodcast] = useState<PodcastDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getMediaElement = () => {
    if (!podcast) return null;
    const hasVideo = Boolean(podcast.videoUrl || podcast.youtubeUrl || podcast.externalVideoUrl);
    const preferVideo = podcast.mediaType === 'VIDEO' && hasVideo;
    return preferVideo ? videoRef.current : audioRef.current;
  };

  useEffect(() => {
    if (id) {
      fetchPodcast();
    }
  }, [id]);

  const fetchPodcast = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await podcastService.getById(id!);
      setPodcast(data);
      setDuration(data.duration || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Podcast yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    const mediaElement = getMediaElement();
    if (!mediaElement) return;

    if (isPlaying) {
      mediaElement.pause();
    } else {
      mediaElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    const mediaElement = getMediaElement();
    if (mediaElement) {
      setCurrentTime(mediaElement.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    const mediaElement = getMediaElement();
    if (mediaElement) {
      setDuration(mediaElement.duration);
    }
  };

  const handleSeek = (_: Event, value: number | number[]) => {
    const time = value as number;
    const mediaElement = getMediaElement();
    if (mediaElement) {
      mediaElement.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (_: Event, value: number | number[]) => {
    const vol = value as number;
    setVolume(vol);
    const mediaElement = getMediaElement();
    if (mediaElement) {
      mediaElement.volume = vol;
    }
    if (vol === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const mediaElement = getMediaElement();
    if (mediaElement) {
      mediaElement.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = window.confirm('Bu podcast silinsin mi?');
    if (!confirmed) return;
    try {
      await podcastService.delete(id);
      navigate('/podcasts');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Podcast silinemedi');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<IconArrowLeft />} onClick={() => navigate('/podcasts')}>
          Geri Don
        </Button>
      </Box>
    );
  }

  if (!podcast) {
    return null;
  }

  const hasAudio = podcast.audioUrl;
  const hasVideo = podcast.videoUrl || podcast.youtubeUrl || podcast.externalVideoUrl;
  const mediaUrl = podcast.videoUrl || podcast.audioUrl;

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton onClick={() => navigate('/podcasts')}>
            <IconArrowLeft />
          </IconButton>
          <Typography variant="h4" fontWeight={600}>
            Podcast Detay
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<IconEdit size={20} />}
            onClick={() => navigate(`/podcasts/${id}/edit`)}
          >
            Duzenle
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<IconTrash size={20} />}
            onClick={handleDelete}
          >
            Sil
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Cover and Info */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                <Avatar
                  src={podcast.coverImageUrl || '/images/default-podcast-cover.svg'}
                  variant="rounded"
                  sx={{ width: 200, height: 200 }}
                >
                  {podcast.title.charAt(0)}
                </Avatar>
                <Box flex={1}>
                  <Stack direction="row" spacing={1} mb={1}>
                    <Chip
                      label={podcast.isPublished ? 'Yayinda' : 'Taslak'}
                      size="small"
                      color={podcast.isPublished ? 'success' : 'default'}
                    />
                    {podcast.isFeatured && (
                      <Chip label="One Cikan" size="small" color="primary" />
                    )}
                    <Chip
                      icon={podcast.mediaType === 'VIDEO' ? <IconVideo size={14} /> : <IconMusic size={14} />}
                      label={podcast.mediaType === 'VIDEO' ? 'Video' : podcast.mediaType === 'AUDIO' ? 'Ses' : 'Video'}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    {podcast.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {podcast.description || 'Aciklama yok'}
                  </Typography>
                  <Stack direction="row" spacing={3} flexWrap="wrap">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconUser size={18} />
                      <Typography variant="body2">
                        {podcast.owner?.name || 'Bilinmeyen'}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconCategory size={18} />
                      <Typography variant="body2">
                        {podcast.categories?.map(c => c.name).join(', ') || '-'}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconClock size={18} />
                      <Typography variant="body2">
                        {formatTime(podcast.duration || 0)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconCalendar size={18} />
                      <Typography variant="body2">
                        {formatDate(podcast.publishedAt)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Media Player */}
          {(hasAudio || hasVideo) && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Oynatici
                </Typography>

                {/* Video Player */}
                {podcast.mediaType === 'VIDEO' && podcast.videoUrl && (
                  <Box sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', bgcolor: 'black' }}>
                    <video
                      ref={videoRef}
                      src={podcast.videoUrl}
                      style={{ width: '100%', maxHeight: 400 }}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={() => setIsPlaying(false)}
                      poster={podcast.thumbnailUrl || podcast.coverImageUrl || undefined}
                    />
                  </Box>
                )}

                {/* YouTube Embed */}
                {podcast.youtubeUrl && (
                  <Box sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
                    <Box
                      component="iframe"
                      src={podcast.youtubeUrl.replace('watch?v=', 'embed/')}
                      sx={{ width: '100%', height: 400, border: 'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </Box>
                )}

                {/* Audio Player */}
                {podcast.mediaType !== 'VIDEO' && podcast.audioUrl && (
                  <audio
                    ref={audioRef}
                    src={podcast.audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    style={{ display: 'none' }}
                  />
                )}

                {/* Player Controls */}
                {mediaUrl && !podcast.youtubeUrl && (
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Stack spacing={2}>
                      {/* Progress */}
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="caption" sx={{ minWidth: 45 }}>
                          {formatTime(currentTime)}
                        </Typography>
                        <Slider
                          value={currentTime}
                          max={duration || 100}
                          onChange={handleSeek}
                          sx={{ flex: 1 }}
                        />
                        <Typography variant="caption" sx={{ minWidth: 45 }}>
                          {formatTime(duration)}
                        </Typography>
                      </Stack>

                      {/* Controls */}
                      <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                        <IconButton onClick={togglePlay} size="large" color="primary">
                          {isPlaying ? <IconPlayerPause size={32} /> : <IconPlayerPlay size={32} />}
                        </IconButton>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: 150 }}>
                          <IconButton onClick={toggleMute} size="small">
                            {isMuted ? <IconVolumeOff size={20} /> : <IconVolume size={20} />}
                          </IconButton>
                          <Slider
                            value={isMuted ? 0 : volume}
                            max={1}
                            step={0.1}
                            onChange={handleVolumeChange}
                            size="small"
                          />
                        </Stack>
                      </Stack>
                    </Stack>
                  </Paper>
                )}

                {!mediaUrl && !podcast.youtubeUrl && (
                  <Alert severity="info">
                    Bu podcast icin medya dosyasi yuklenmemis.
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Episodes */}
          {podcast.episodes && podcast.episodes.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Bolumler ({podcast.episodes.length})
                </Typography>
                <List>
                  {podcast.episodes.map((episode, index) => (
                    <React.Fragment key={episode.id}>
                      {index > 0 && <Divider />}
                      <ListItem
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        onClick={() => navigate(`/episodes/${episode.id}`)}
                      >
                        <ListItemIcon>
                          <IconMusic size={24} />
                        </ListItemIcon>
                        <ListItemText
                          primary={episode.title}
                          secondary={
                            <Stack direction="row" spacing={2}>
                              <span>{formatTime(episode.duration || 0)}</span>
                              <span>{formatDate(episode.publishedAt)}</span>
                            </Stack>
                          }
                        />
                        <Chip
                          label={episode.isPublished ? 'Yayinda' : 'Taslak'}
                          size="small"
                          color={episode.isPublished ? 'success' : 'default'}
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Tags */}
          {podcast.tags && podcast.tags.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Etiketler
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {podcast.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Media Links */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Medya Bilgileri
              </Typography>
              <Stack spacing={2}>
                {podcast.audioUrl && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconMusic size={20} />
                    <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                      Ses: {podcast.audioMimeType || 'audio'}
                    </Typography>
                  </Stack>
                )}
                {podcast.videoUrl && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconVideo size={20} />
                    <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                      Video: {podcast.videoMimeType || 'video'}
                    </Typography>
                  </Stack>
                )}
                {podcast.youtubeUrl && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconBrandYoutube size={20} />
                    <Typography
                      variant="body2"
                      component="a"
                      href={podcast.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: 'primary.main' }}
                    >
                      YouTube
                    </Typography>
                  </Stack>
                )}
                {podcast.externalVideoUrl && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconVideo size={20} />
                    <Typography
                      variant="body2"
                      component="a"
                      href={podcast.externalVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: 'primary.main' }}
                    >
                      Harici Video
                    </Typography>
                  </Stack>
                )}
                <Divider />
                <Typography variant="body2" color="text.secondary">
                  Kalite: {podcast.defaultQuality}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sure: {formatTime(podcast.duration || 0)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PodcastDetailPage;
