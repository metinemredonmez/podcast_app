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
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Autocomplete,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { IconArrowLeft, IconHeadphones, IconVideo, IconStar } from '@tabler/icons-react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { podcastService } from '../../api/services/podcast.service';
import { categoryService, Category } from '../../api/services/category.service';
import { ImageUpload, AudioUpload, VideoUpload } from '../../components/upload';

// Media type options
const MEDIA_TYPES = [
  { value: 'AUDIO', label: 'Sesli Podcast', icon: IconHeadphones },
  { value: 'VIDEO', label: 'Video Podcast', icon: IconVideo },
];

// Quality options
const QUALITY_OPTIONS = [
  { value: 'SD', label: 'SD (480p)' },
  { value: 'HD', label: 'HD (720p)' },
  { value: 'FULL_HD', label: 'Full HD (1080p)' },
  { value: 'UHD_4K', label: '4K Ultra HD' },
];

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
  title: yup.string().required('Başlık gerekli').min(3, 'Başlık en az 3 karakter olmalı').max(120, 'En fazla 120 karakter'),
  description: yup.string().max(500, 'Açıklama en fazla 500 karakter olmalı'),
  categoryId: yup.string().required('Kategori seçimi gerekli'),
  mediaType: yup.string().required('Medya türü seçimi gerekli'),
  defaultQuality: yup.string().required('Kalite seçimi gerekli'),
});

const CreatePodcastPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.list();
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      categoryId: '',
      coverImageUrl: '',
      mediaType: 'AUDIO',
      defaultQuality: 'HD',
      // Audio/Video fields
      audioUrl: '',
      videoUrl: '',
      youtubeUrl: '',
      externalVideoUrl: '',
      thumbnailUrl: '',
      duration: 0,
      // Tags
      tags: [] as string[],
      // Featured
      isFeatured: false,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);

      try {
        await podcastService.create({
          title: values.title,
          description: values.description || undefined,
          categoryId: values.categoryId || undefined,
          coverImageUrl: values.coverImageUrl || undefined,
          mediaType: values.mediaType as any,
          defaultQuality: values.defaultQuality as any,
          // Media fields
          audioUrl: values.audioUrl || undefined,
          videoUrl: values.videoUrl || undefined,
          youtubeUrl: values.youtubeUrl || undefined,
          externalVideoUrl: values.externalVideoUrl || undefined,
          thumbnailUrl: values.thumbnailUrl || undefined,
          duration: values.duration || undefined,
          // Metadata
          tags: values.tags?.length ? values.tags : undefined,
          isFeatured: values.isFeatured,
        });
        navigate('/podcasts');
      } catch (err: any) {
        const message = err.response?.data?.message || 'Podcast oluşturulamadı';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Box>
      {/* Page Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Button
          startIcon={<IconArrowLeft size={20} />}
          onClick={() => navigate('/podcasts')}
          color="inherit"
        >
          Geri
        </Button>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Podcast Oluştur
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Platforma yeni bir podcast ekleyin
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
                  <TextField
                    fullWidth
                    id="title"
                    name="title"
                    label="Podcast Başlığı"
                    placeholder="Podcast başlığını girin"
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
                    placeholder="Podcast açıklamasını girin"
                    multiline
                    rows={4}
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.description && Boolean(formik.errors.description)}
                    helperText={
                      (formik.touched.description && formik.errors.description) ||
                      `${(formik.values.description || '').length}/500 karakter`
                    }
                  />

                  <FormControl fullWidth error={formik.touched.categoryId && Boolean(formik.errors.categoryId)}>
                    <InputLabel>Kategori</InputLabel>
                    {categoriesLoading ? (
                      <Skeleton variant="rectangular" height={56} />
                    ) : (
                      <Select
                        id="categoryId"
                        name="categoryId"
                        label="Kategori"
                        value={formik.values.categoryId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      >
                        {categories.map((cat) => (
                          <MenuItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                    {formik.touched.categoryId && formik.errors.categoryId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                        {formik.errors.categoryId}
                      </Typography>
                    )}
                  </FormControl>

                  {/* Media Type Selection */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Medya Türü
                    </Typography>
                    <ToggleButtonGroup
                      value={formik.values.mediaType}
                      exclusive
                      onChange={(_, newValue) => {
                        if (newValue) formik.setFieldValue('mediaType', newValue);
                      }}
                      fullWidth
                      sx={{ mb: 1 }}
                    >
                      {MEDIA_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <ToggleButton key={type.value} value={type.value} sx={{ py: 1.5 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Icon size={20} />
                              <span>{type.label}</span>
                            </Stack>
                          </ToggleButton>
                        );
                      })}
                    </ToggleButtonGroup>
                    {formik.touched.mediaType && formik.errors.mediaType && (
                      <Typography variant="caption" color="error">
                        {formik.errors.mediaType}
                      </Typography>
                    )}
                  </Box>

                  {/* Quality Selection */}
                  <FormControl fullWidth>
                    <InputLabel>Varsayılan Kalite</InputLabel>
                    <Select
                      id="defaultQuality"
                      name="defaultQuality"
                      label="Varsayılan Kalite"
                      value={formik.values.defaultQuality}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.defaultQuality && Boolean(formik.errors.defaultQuality)}
                    >
                      {QUALITY_OPTIONS.map((quality) => (
                        <MenuItem key={quality.value} value={quality.value}>
                          {quality.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {formik.touched.defaultQuality && formik.errors.defaultQuality && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                        {formik.errors.defaultQuality}
                      </Typography>
                    )}
                  </FormControl>

                  {/* Audio Upload - Show if AUDIO type */}
                  {formik.values.mediaType === 'AUDIO' && (
                    <AudioUpload
                      label="Tanıtım Ses Dosyası (Opsiyonel)"
                      prefix="podcasts"
                      currentAudioUrl={formik.values.audioUrl || undefined}
                      onUploadComplete={(response) => {
                        formik.setFieldValue('audioUrl', response.url);
                      }}
                      onDurationChange={(duration) => {
                        formik.setFieldValue('duration', duration);
                      }}
                      onRemove={() => {
                        formik.setFieldValue('audioUrl', '');
                        formik.setFieldValue('duration', 0);
                      }}
                      disabled={loading}
                    />
                  )}

                  {/* Video Upload - Show if VIDEO type */}
                  {formik.values.mediaType === 'VIDEO' && (
                    <VideoUpload
                      label="Tanıtım Videosu / YouTube / Harici URL (Opsiyonel)"
                      prefix="podcasts"
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
                    label="Thumbnail (Küçük Resim - Opsiyonel)"
                    prefix="podcasts/thumbnails"
                    currentImageUrl={formik.values.thumbnailUrl || undefined}
                    placeholderImage="/images/default-thumbnail.svg"
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

                  {/* Duration & Featured */}
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                      fullWidth
                      id="duration"
                      name="duration"
                      label="Süre (saniye)"
                      type="number"
                      value={formik.values.duration}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      helperText={
                        formik.values.duration ? `${formatDuration(formik.values.duration)}` : 'Ses/video yükleyince otomatik hesaplanır'
                      }
                    />

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
                </Stack>
              </Grid>

              <Grid item xs={12} md={4}>
                <Stack spacing={3}>
                  <ImageUpload
                    label="Kapak Resmi (Opsiyonel)"
                    prefix="podcast-covers"
                    aspectRatio="1:1"
                    previewWidth={200}
                    currentImageUrl={formik.values.coverImageUrl || undefined}
                    placeholderImage="/images/default-podcast-cover.svg"
                    onUploadComplete={(response) => {
                      formik.setFieldValue('coverImageUrl', response.url);
                    }}
                    onRemove={() => {
                      formik.setFieldValue('coverImageUrl', '');
                    }}
                    disabled={loading}
                  />

                  {/* Instructions */}
                  <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 2 }}>
                    <Typography variant="subtitle2" gutterBottom color="info.main">
                      Podcast Ekleme Rehberi
                    </Typography>
                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        1. Podcast başlığı ve açıklama girin
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        2. Kategori seçin
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        3. Medya türünü seçin (Ses veya Video)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        4. Opsiyonel: Kapak resmi, thumbnail, etiketler ekleyin
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      * Kapak resmi ve thumbnail eklenmezse varsayılan resim kullanılır
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/podcasts')}
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
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Podcast Oluştur'}
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

export default CreatePodcastPage;
