import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Skeleton,
  Chip,
  Autocomplete,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  IconArrowLeft,
  IconStar,
  IconMicrophone,
} from '@tabler/icons-react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { episodeService } from '../../api/services/episode.service';
import { podcastService, Podcast } from '../../api/services/podcast.service';
import { AudioUpload, VideoUpload, ImageUpload } from '../../components/upload';

const QUALITY_OPTIONS = ['SD', 'HD', '4K'];

const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const validationSchema = yup.object({
  title: yup.string().required('Başlık gerekli').min(3, 'Başlık en az 3 karakter olmalı').max(160, 'En fazla 160 karakter'),
  description: yup.string().max(2000, 'Açıklama en fazla 2000 karakter olmalı'),
  podcastId: yup.string().required('Podcast seçimi gerekli'),
  duration: yup.number().min(1, 'Süre en az 1 saniye olmalı'),
  episodeNumber: yup.number().min(1, 'En az 1 olmalı').nullable(),
  seasonNumber: yup.number().min(1, 'En az 1 olmalı').nullable(),
  tags: yup.array().of(yup.string()),
  quality: yup.string(),
  isFeatured: yup.boolean(),
});

const CreateEpisodePage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [podcastsLoading, setPodcastsLoading] = useState(true);

  // Fetch podcasts from API
  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        const response = await podcastService.list({ limit: 100 });
        setPodcasts(response.data);
      } catch (err) {
        console.error('Failed to fetch podcasts:', err);
      } finally {
        setPodcastsLoading(false);
      }
    };
    fetchPodcasts();
  }, []);

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      podcastId: '',
      audioUrl: '',
      videoUrl: '',
      youtubeUrl: '',
      externalVideoUrl: '',
      thumbnailUrl: '',
      duration: 0,
      episodeNumber: '',
      seasonNumber: '',
      tags: [] as string[],
      quality: 'HD',
      isFeatured: false,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);

      try {
        const mediaType = selectedPodcast?.mediaType ?? 'AUDIO';
        const audioProvided = Boolean(values.audioUrl);
        const videoProvided = Boolean(values.videoUrl || values.youtubeUrl || values.externalVideoUrl);
        const durationValid = Number(values.duration) > 0 && Number.isFinite(Number(values.duration));
        if (mediaType === 'AUDIO') {
          if (!audioProvided) {
            setError('Sesli podcast için bölüm ses dosyası gerekli.');
            return;
          }
          if (videoProvided) {
            setError('Sesli podcast için video eklenemez.');
            return;
          }
          if (!durationValid) {
            setError('Sesli bölüm için süre gerekli.');
            return;
          }
        } else if (mediaType === 'VIDEO') {
          if (!videoProvided) {
            setError('Video podcast için video kaynağı gerekli.');
            return;
          }
          if (audioProvided) {
            setError('Video podcast için ses dosyası eklenemez.');
            return;
          }
          if (!durationValid) {
            setError('Video bölüm için süre gerekli. YouTube/Harici URL ise manuel girin.');
            return;
          }
        } else if (!audioProvided && !videoProvided) {
          setError('En az bir ses veya video kaynağı ekleyin.');
          return;
        } else if (!durationValid) {
          setError('Süre gerekli. YouTube/Harici URL ise manuel girin.');
          return;
        }

        await episodeService.create({
          title: values.title,
          description: values.description || undefined,
          podcastId: values.podcastId,
          audioUrl: values.audioUrl || undefined,
          videoUrl: values.videoUrl || undefined,
          youtubeUrl: values.youtubeUrl || undefined,
          externalVideoUrl: values.externalVideoUrl || undefined,
          thumbnailUrl: values.thumbnailUrl || undefined,
          duration: values.duration ? Number(values.duration) : undefined,
          episodeNumber: values.episodeNumber ? Number(values.episodeNumber) : undefined,
          seasonNumber: values.seasonNumber ? Number(values.seasonNumber) : undefined,
          tags: values.tags?.length ? values.tags : undefined,
          quality: values.quality || undefined,
          isFeatured: values.isFeatured,
        });
        const targetFilter = mediaType === 'VIDEO' ? 'video' : 'audio';
        navigate(`/episodes?media=${targetFilter}`);
      } catch (err: any) {
        const message = err.response?.data?.message || 'Bölüm oluşturulamadı';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
  });

  // Get selected podcast info
  const selectedPodcast = podcasts.find((p) => p.id === formik.values.podcastId);
  const mediaType = selectedPodcast?.mediaType ?? 'AUDIO';
  const allowAudio = mediaType !== 'VIDEO';
  const allowVideo = mediaType !== 'AUDIO';

  useEffect(() => {
    if (!selectedPodcast) return;
    if (mediaType === 'AUDIO') {
      formik.setFieldValue('videoUrl', '');
      formik.setFieldValue('youtubeUrl', '');
      formik.setFieldValue('externalVideoUrl', '');
    }
    if (mediaType === 'VIDEO') {
      formik.setFieldValue('audioUrl', '');
    }
  }, [mediaType, selectedPodcast?.id]);

  return (
    <Box>
      {/* Page Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Button
          startIcon={<IconArrowLeft size={20} />}
          onClick={() => navigate('/episodes')}
          color="inherit"
        >
          Geri
        </Button>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Bölüm Oluştur
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Podcaste yeni bir bölüm ekleyin
          </Typography>
        </Box>
      </Stack>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Form Card */}
      <Card>
        <CardContent>
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Stack spacing={3}>
                  {/* Podcast Selection */}
                  <FormControl fullWidth error={formik.touched.podcastId && Boolean(formik.errors.podcastId)}>
                    <InputLabel>Podcast Seç</InputLabel>
                    {podcastsLoading ? (
                      <Skeleton variant="rectangular" height={56} />
                    ) : (
                      <Select
                        id="podcastId"
                        name="podcastId"
                        label="Podcast Seç"
                        value={formik.values.podcastId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      >
                        {podcasts.map((podcast) => (
                          <MenuItem key={podcast.id} value={podcast.id}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {podcast.coverImageUrl ? (
                                <Box
                                  component="img"
                                  src={podcast.coverImageUrl}
                                  alt={podcast.title}
                                  sx={{ width: 24, height: 24, borderRadius: 0.5, objectFit: 'cover' }}
                                />
                              ) : (
                                <IconMicrophone size={20} />
                              )}
                              <span>{podcast.title}</span>
                            </Stack>
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                    {formik.touched.podcastId && formik.errors.podcastId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                        {formik.errors.podcastId}
                      </Typography>
                    )}
                  </FormControl>

                  {/* Selected Podcast Info */}
                  {selectedPodcast && (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Seçilen Podcast
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        {selectedPodcast.coverImageUrl ? (
                          <Box
                            component="img"
                            src={selectedPodcast.coverImageUrl}
                            alt={selectedPodcast.title}
                            sx={{ width: 48, height: 48, borderRadius: 1, objectFit: 'cover' }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 1,
                              bgcolor: 'primary.light',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <IconMicrophone size={24} color="#5D87FF" />
                          </Box>
                        )}
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {selectedPodcast.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedPodcast._count?.episodes || 0} bölüm
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  )}

                  <TextField
                    fullWidth
                    id="title"
                    name="title"
                    label="Bölüm Başlığı"
                    placeholder="Bölüm başlığını girin"
                    value={formik.values.title}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.title && Boolean(formik.errors.title)}
                    helperText={formik.touched.title && formik.errors.title}
                  />

                  <TextField
                    fullWidth
                    id="description"
                    name="description"
                    label="Açıklama"
                    placeholder="Bölüm açıklamasını girin"
                    multiline
                    rows={4}
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.description && Boolean(formik.errors.description)}
                    helperText={
                      (formik.touched.description && formik.errors.description) ||
                      `${(formik.values.description || '').length}/2000 karakter`
                    }
                  />

                  {allowAudio && (
                    <AudioUpload
                      label="Ses Dosyası"
                      prefix="episodes"
                      currentAudioUrl={formik.values.audioUrl || undefined}
                      onUploadComplete={(response) => {
                        formik.setFieldValue('audioUrl', response.url);
                      }}
                      onDurationChange={(duration) => {
                        formik.setFieldValue('duration', duration);
                      }}
                      onRemove={() => {
                        formik.setFieldValue('audioUrl', '');
                        if (!formik.values.videoUrl) {
                          formik.setFieldValue('duration', 0);
                        }
                      }}
                      disabled={loading}
                    />
                  )}

                  {/* Video Upload */}
                  {allowVideo && (
                    <VideoUpload
                      label="Video Dosyası / YouTube / Harici URL"
                      prefix="episodes"
                      currentVideoUrl={formik.values.videoUrl || undefined}
                      currentYoutubeUrl={formik.values.youtubeUrl || undefined}
                      currentExternalUrl={formik.values.externalVideoUrl || undefined}
                      onUploadComplete={(response) => {
                        formik.setFieldValue('videoUrl', response.url);
                        formik.setFieldValue('youtubeUrl', '');
                        formik.setFieldValue('externalVideoUrl', '');
                      }}
                      onDurationChange={(duration) => {
                        formik.setFieldValue('duration', duration);
                      }}
                      onYoutubeUrlChange={(url) => {
                        formik.setFieldValue('youtubeUrl', url);
                        formik.setFieldValue('videoUrl', '');
                        formik.setFieldValue('externalVideoUrl', '');
                      }}
                      onExternalUrlChange={(url) => {
                        formik.setFieldValue('externalVideoUrl', url);
                        formik.setFieldValue('videoUrl', '');
                        formik.setFieldValue('youtubeUrl', '');
                      }}
                      onRemove={() => {
                        formik.setFieldValue('videoUrl', '');
                        formik.setFieldValue('youtubeUrl', '');
                        formik.setFieldValue('externalVideoUrl', '');
                      }}
                      disabled={loading}
                    />
                  )}

                  {/* Thumbnail Upload */}
                  <ImageUpload
                    label="Bölüm Kapak Resmi (Thumbnail)"
                    prefix="episodes/thumbnails"
                    currentImageUrl={formik.values.thumbnailUrl || undefined}
                    onUploadComplete={(response) => {
                      formik.setFieldValue('thumbnailUrl', response.url);
                    }}
                    onRemove={() => {
                      formik.setFieldValue('thumbnailUrl', '');
                    }}
                    disabled={loading}
                    aspectRatio="16:9"
                  />

                  {/* Tags */}
                  <Autocomplete
                    multiple
                    freeSolo
                    options={[]}
                    value={formik.values.tags || []}
                    onChange={(_, newValue) => {
                      formik.setFieldValue('tags', newValue);
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return (
                          <Chip
                            key={key}
                            label={option}
                            size="small"
                            {...tagProps}
                          />
                        );
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Etiketler (Tags)"
                        placeholder="Etiket eklemek için yazın ve Enter'a basın"
                        helperText="Örn: kuran, bakara, sureler, dua"
                      />
                    )}
                    disabled={loading}
                  />

                  {/* Quality & Featured */}
                  <Stack direction="row" spacing={2} alignItems="center">
                    {allowVideo && (
                      <TextField
                        select
                        fullWidth
                        id="quality"
                        name="quality"
                        label="Video Kalitesi"
                        value={formik.values.quality}
                        onChange={formik.handleChange}
                        disabled={loading}
                      >
                        <MenuItem value="">Seçiniz</MenuItem>
                        {QUALITY_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}

                    <FormControlLabel
                      control={
                        <Switch
                          checked={formik.values.isFeatured}
                          onChange={(e) => formik.setFieldValue('isFeatured', e.target.checked)}
                          disabled={loading}
                        />
                      }
                      label={
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <IconStar size={18} />
                          <span>Öne Çıkan</span>
                        </Stack>
                      }
                      sx={{ minWidth: 150 }}
                    />
                  </Stack>

                  {/* Duration, Season, Episode Numbers */}
                  <Stack direction="row" spacing={2}>
                    <TextField
                      fullWidth
                      id="duration"
                      name="duration"
                      label="Süre (saniye)"
                      type="number"
                      value={formik.values.duration}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.duration && Boolean(formik.errors.duration)}
                      helperText={
                        (formik.touched.duration && formik.errors.duration) ||
                        (formik.values.duration
                          ? `${formatDuration(formik.values.duration)}`
                          : 'Ses/video yükleyince otomatik hesaplanır. YouTube/Harici URL için manuel girin.')
                      }
                    />
                    <TextField
                      fullWidth
                      id="seasonNumber"
                      name="seasonNumber"
                      label="Sezon #"
                      type="number"
                      value={formik.values.seasonNumber}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.seasonNumber && Boolean(formik.errors.seasonNumber)}
                      helperText={formik.touched.seasonNumber && formik.errors.seasonNumber}
                    />
                    <TextField
                      fullWidth
                      id="episodeNumber"
                      name="episodeNumber"
                      label="Bölüm #"
                      type="number"
                      value={formik.values.episodeNumber}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.episodeNumber && Boolean(formik.errors.episodeNumber)}
                      helperText={formik.touched.episodeNumber && formik.errors.episodeNumber}
                    />
                  </Stack>
                </Stack>
              </Grid>

              <Grid item xs={12} md={4}>
                {/* Instructions */}
                <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 2 }}>
                  <Typography variant="subtitle2" gutterBottom color="info.main">
                    Bölüm Ekleme Rehberi
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      1. Önce hangi podcast'e ekleyeceğinizi seçin
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      2. Bölüm başlığı ve açıklama girin
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      3. Ses veya video dosyası yükleyin
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      4. İsteğe bağlı olarak thumbnail, etiketler ve kalite seçin
                    </Typography>
                  </Stack>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/episodes')}
                    disabled={loading}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{ minWidth: 120 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Bölüm Oluştur'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateEpisodePage;
