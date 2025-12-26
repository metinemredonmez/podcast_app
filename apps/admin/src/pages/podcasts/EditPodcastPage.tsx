import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Autocomplete,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  IconArrowLeft,
  IconTrash,
  IconDeviceFloppy,
  IconPlayerPlay,
  IconPlayerPause,
  IconHeadphones,
  IconVideo,
  IconStar,
} from '@tabler/icons-react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { podcastService, Podcast, UpdatePodcastDto } from '../../api/services/podcast.service';
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
  title: yup.string().required('Başlık gerekli').min(3, 'En az 3 karakter').max(120, 'En fazla 120 karakter'),
  description: yup.string().max(500, 'En fazla 500 karakter'),
  categoryId: yup.string().required('Kategori seçimi gerekli'),
});

const EditPodcastPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // States
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleMediaTypeChange = (_: React.MouseEvent<HTMLElement>, newValue: string | null) => {
    if (!newValue) return;
    formik.setFieldValue('mediaType', newValue);
    const target = newValue === 'VIDEO' ? 'video' : 'audio';
    navigate(`/episodes?media=${target}`);
  };

  // Fetch podcast and categories
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('Podcast ID bulunamadı');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [podcastData, categoriesData] = await Promise.all([
          podcastService.get(id),
          categoryService.list(),
        ]);
        setPodcast(podcastData);
        setCategories(categoriesData);
      } catch (err: any) {
        const message = err.response?.data?.message || 'Podcast yüklenemedi';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Formik setup
  const formik = useFormik({
    initialValues: {
      title: podcast?.title || '',
      description: podcast?.description || '',
      categoryId: podcast?.categories?.[0]?.id || '',
      coverImageUrl: podcast?.coverImageUrl || '',
      mediaType: podcast?.mediaType || 'AUDIO',
      defaultQuality: podcast?.defaultQuality || 'HD',
      // Audio/Video fields
      audioUrl: podcast?.audioUrl || '',
      videoUrl: podcast?.videoUrl || '',
      youtubeUrl: podcast?.youtubeUrl || '',
      externalVideoUrl: podcast?.externalVideoUrl || '',
      thumbnailUrl: podcast?.thumbnailUrl || '',
      duration: podcast?.duration || 0,
      // Tags
      tags: podcast?.tags || [],
      // Featured
      isFeatured: podcast?.isFeatured || false,
    },
    enableReinitialize: true,
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      if (!id) return;

      setSaving(true);
      setError(null);

      try {
        const updateData: UpdatePodcastDto = {
          title: values.title,
          description: values.description || undefined,
          categoryIds: values.categoryId ? [values.categoryId] : undefined,
          coverImageUrl: values.coverImageUrl || undefined,
          mediaType: values.mediaType as any,
          defaultQuality: values.defaultQuality as any,
          audioUrl: values.audioUrl || undefined,
          videoUrl: values.videoUrl || undefined,
          youtubeUrl: values.youtubeUrl || undefined,
          externalVideoUrl: values.externalVideoUrl || undefined,
          thumbnailUrl: values.thumbnailUrl || undefined,
          duration: values.duration || undefined,
          tags: values.tags?.length ? values.tags : undefined,
          isFeatured: values.isFeatured,
        };

        await podcastService.update(id, updateData);
        setSnackbar({ open: true, message: 'Podcast başarıyla güncellendi', severity: 'success' });
        // Başarılı güncelleme sonrası podcasts listesine yönlendir
        setTimeout(() => navigate('/podcasts'), 1000);
      } catch (err: any) {
        const message = err.response?.data?.message || 'Podcast güncellenemedi';
        setError(message);
        setSnackbar({ open: true, message, severity: 'error' });
      } finally {
        setSaving(false);
      }
    },
  });

  // Publish/Unpublish handler
  const handlePublishToggle = async () => {
    if (!id || !podcast) return;

    setSaving(true);
    try {
      if (podcast.isPublished) {
        // Unpublish
        await podcastService.update(id, { isPublished: false });
        setPodcast({ ...podcast, isPublished: false });
        setSnackbar({ open: true, message: 'Podcast yayından kaldırıldı', severity: 'success' });
      } else {
        // Publish
        await podcastService.update(id, { isPublished: true });
        setPodcast({ ...podcast, isPublished: true, publishedAt: new Date().toISOString() });
        setSnackbar({ open: true, message: 'Podcast yayınlandı', severity: 'success' });
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'İşlem başarısız';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!id) return;

    setDeleting(true);
    try {
      await podcastService.delete(id);
      setSnackbar({ open: true, message: 'Podcast başarıyla silindi', severity: 'success' });
      setTimeout(() => navigate('/podcasts'), 500);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Podcast silinemedi';
      setSnackbar({ open: true, message, severity: 'error' });
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Skeleton variant="rectangular" width={80} height={36} />
          <Box>
            <Skeleton variant="text" width={200} height={40} />
            <Skeleton variant="text" width={150} height={24} />
          </Box>
        </Stack>
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Stack spacing={3}>
                  <Skeleton variant="rectangular" height={56} />
                  <Skeleton variant="rectangular" height={120} />
                  <Skeleton variant="rectangular" height={56} />
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                <Skeleton variant="rectangular" height={200} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Error state
  if (error && !podcast) {
    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Button
            startIcon={<IconArrowLeft size={20} />}
            onClick={() => navigate('/podcasts')}
            color="inherit"
          >
            Geri
          </Button>
        </Stack>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button
            startIcon={<IconArrowLeft size={20} />}
            onClick={() => navigate('/podcasts')}
            color="inherit"
          >
            Geri
          </Button>
          <Box>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="h4" fontWeight={600}>
                Podcast Düzenle
              </Typography>
              {podcast && (
                <Chip
                  label={podcast.isPublished ? 'Yayında' : 'Taslak'}
                  color={podcast.isPublished ? 'success' : 'default'}
                  size="small"
                />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {podcast?.title}
            </Typography>
          </Box>
        </Stack>

        {/* Status Actions */}
        <Stack direction="row" spacing={1}>
          {podcast && !podcast.isPublished && (
            <Button
              variant="contained"
              color="success"
              startIcon={<IconPlayerPlay size={18} />}
              onClick={handlePublishToggle}
              disabled={saving}
            >
              Yayınla
            </Button>
          )}
          {podcast && podcast.isPublished && (
            <Button
              variant="outlined"
              startIcon={<IconPlayerPause size={18} />}
              onClick={handlePublishToggle}
              disabled={saving}
            >
              Yayından Kaldır
            </Button>
          )}
          <Button
            variant="outlined"
            color="error"
            startIcon={<IconTrash size={18} />}
            onClick={() => setDeleteDialogOpen(true)}
            disabled={saving || deleting}
          >
            Sil
          </Button>
        </Stack>
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
                    {formik.touched.categoryId && formik.errors.categoryId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                        {String(formik.errors.categoryId)}
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
                      onChange={handleMediaTypeChange}
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
                    >
                      {QUALITY_OPTIONS.map((quality) => (
                        <MenuItem key={quality.value} value={quality.value}>
                          {quality.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Audio Upload - Show if AUDIO type */}
                  {formik.values.mediaType === 'AUDIO' && (
                    <AudioUpload
                      label="Tanıtım Ses Dosyası"
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
                      disabled={saving}
                    />
                  )}

                  {/* Video Upload - Show if VIDEO type */}
                  {formik.values.mediaType === 'VIDEO' && (
                    <VideoUpload
                      label="Tanıtım Videosu / YouTube / Harici URL"
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
                      disabled={saving}
                    />
                  )}

                  {/* Thumbnail Upload */}
                  <ImageUpload
                    label="Thumbnail (Küçük Resim)"
                    prefix="podcasts/thumbnails"
                    currentImageUrl={formik.values.thumbnailUrl || undefined}
                    placeholderImage="/images/default-thumbnail.svg"
                    onUploadComplete={(response) => {
                      formik.setFieldValue('thumbnailUrl', response.url);
                    }}
                    onRemove={() => {
                      formik.setFieldValue('thumbnailUrl', '');
                    }}
                    disabled={saving}
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
                    disabled={saving}
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
                          disabled={saving}
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

                  {/* Podcast Stats (Read-only) */}
                  {podcast && (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Podcast İstatistikleri
                      </Typography>
                      <Stack direction="row" spacing={4}>
                        <Box>
                          <Typography variant="h6">{podcast._count?.episodes || 0}</Typography>
                          <Typography variant="caption" color="text.secondary">Bölümler</Typography>
                        </Box>
                        <Box>
                          <Typography variant="h6">
                            {new Date(podcast.createdAt).toLocaleDateString('tr-TR')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Oluşturulma</Typography>
                        </Box>
                        {podcast.publishedAt && (
                          <Box>
                            <Typography variant="h6">
                              {new Date(podcast.publishedAt).toLocaleDateString('tr-TR')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Yayınlanma</Typography>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Grid>

              <Grid item xs={12} md={4}>
                <Stack spacing={3}>
                  <ImageUpload
                    label="Kapak Resmi"
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
                    disabled={saving}
                  />

                  {/* Info Box */}
                  <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 2 }}>
                    <Typography variant="subtitle2" gutterBottom color="info.main">
                      Bilgi
                    </Typography>
                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        Slug: <strong>{podcast?.slug}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: <code style={{ fontSize: 11 }}>{podcast?.id}</code>
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/podcasts')}
                    disabled={saving}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={18} />}
                    sx={{ minWidth: 140 }}
                  >
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Podcast Sil</DialogTitle>
        <DialogContent>
          <DialogContentText>
            "{podcast?.title}" podcast'ini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            Bu podcast'e ait tüm bölümler de silinecektir.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            İptal
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={18} color="inherit" /> : <IconTrash size={18} />}
          >
            {deleting ? 'Siliniyor...' : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditPodcastPage;
