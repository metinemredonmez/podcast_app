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
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Skeleton,
  Paper,
  FormControlLabel,
  Switch,
  Autocomplete,
  MenuItem,
} from '@mui/material';
import {
  IconArrowLeft,
  IconTrash,
  IconDeviceFloppy,
  IconPlayerPlay,
  IconPlayerPause,
  IconMicrophone,
  IconStar,
} from '@tabler/icons-react';
// Note: IconPlayerPlay and IconPlayerPause used for Publish/Unpublish buttons
import { useFormik } from 'formik';
import * as yup from 'yup';
import { episodeService, Episode, UpdateEpisodeDto } from '../../api/services/episode.service';
import { AudioUpload, VideoUpload, ImageUpload } from '../../components/upload';

const QUALITY_OPTIONS = ['SD', 'HD', '4K'];

const validationSchema = yup.object({
  title: yup.string().required('Title is required').min(3, 'Title must be at least 3 characters').max(160, 'Max 160 characters'),
  description: yup.string().max(2000, 'Description must be less than 2000 characters'),
  audioUrl: yup.string().url('Must be a valid URL'),
  videoUrl: yup.string().url('Must be a valid URL'),
  youtubeUrl: yup.string(),
  externalVideoUrl: yup.string(),
  thumbnailUrl: yup.string().url('Must be a valid URL'),
  duration: yup.number().min(1, 'Duration must be at least 1 second').required('Duration is required'),
  episodeNumber: yup.number().min(1, 'Must be at least 1').nullable(),
  seasonNumber: yup.number().min(1, 'Must be at least 1').nullable(),
  tags: yup.array().of(yup.string()),
  quality: yup.string(),
  isFeatured: yup.boolean(),
});

const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const EditEpisodePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // States
  const [episode, setEpisode] = useState<Episode | null>(null);
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

  // Fetch episode
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('Episode ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const episodeData = await episodeService.get(id);
        setEpisode(episodeData);
      } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to load episode';
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
      title: episode?.title || '',
      description: episode?.description || '',
      audioUrl: episode?.audioUrl || '',
      videoUrl: episode?.videoUrl || '',
      youtubeUrl: episode?.youtubeUrl || '',
      externalVideoUrl: episode?.externalVideoUrl || '',
      thumbnailUrl: episode?.thumbnailUrl || '',
      duration: episode?.duration || 0,
      episodeNumber: episode?.episodeNumber || '',
      seasonNumber: episode?.seasonNumber || '',
      tags: episode?.tags || [],
      quality: episode?.quality || '',
      isFeatured: episode?.isFeatured || false,
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      if (!id) return;

      setSaving(true);
      setError(null);

      try {
        const updateData: UpdateEpisodeDto = {
          title: values.title,
          description: values.description || undefined,
          audioUrl: values.audioUrl || undefined,
          videoUrl: values.videoUrl || undefined,
          youtubeUrl: values.youtubeUrl || undefined,
          externalVideoUrl: values.externalVideoUrl || undefined,
          thumbnailUrl: values.thumbnailUrl || undefined,
          duration: values.duration,
          episodeNumber: values.episodeNumber ? Number(values.episodeNumber) : undefined,
          seasonNumber: values.seasonNumber ? Number(values.seasonNumber) : undefined,
          tags: values.tags?.length ? values.tags : undefined,
          quality: values.quality || undefined,
          isFeatured: values.isFeatured,
        };

        const updated = await episodeService.update(id, updateData);
        setEpisode(updated);
        setSnackbar({ open: true, message: 'Episode updated successfully', severity: 'success' });
      } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to update episode';
        setError(message);
        setSnackbar({ open: true, message, severity: 'error' });
      } finally {
        setSaving(false);
      }
    },
  });

  // Publish/Unpublish handler
  const handlePublishToggle = async () => {
    if (!id || !episode) return;

    setSaving(true);
    try {
      const updated = await episodeService.update(id, {
        isPublished: !episode.isPublished,
      });
      setEpisode(updated);
      setSnackbar({
        open: true,
        message: updated.isPublished ? 'Episode published successfully' : 'Episode unpublished',
        severity: 'success',
      });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update status';
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
      await episodeService.delete(id);
      setSnackbar({ open: true, message: 'Episode deleted successfully', severity: 'success' });
      setTimeout(() => navigate('/episodes'), 500);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete episode';
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
  if (error && !episode) {
    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Button
            startIcon={<IconArrowLeft size={20} />}
            onClick={() => navigate('/episodes')}
            color="inherit"
          >
            Back
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
            onClick={() => navigate('/episodes')}
            color="inherit"
          >
            Back
          </Button>
          <Box>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="h4" fontWeight={600}>
                Edit Episode
              </Typography>
              {episode && (
                <Chip
                  label={episode.isPublished ? 'Published' : 'Draft'}
                  color={episode.isPublished ? 'success' : 'default'}
                  size="small"
                />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {episode?.title}
            </Typography>
          </Box>
        </Stack>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            variant={episode?.isPublished ? 'outlined' : 'contained'}
            color={episode?.isPublished ? 'warning' : 'success'}
            startIcon={episode?.isPublished ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}
            onClick={handlePublishToggle}
            disabled={saving}
          >
            {episode?.isPublished ? 'Unpublish' : 'Publish'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<IconTrash size={18} />}
            onClick={() => setDeleteDialogOpen(true)}
            disabled={saving || deleting}
          >
            Delete
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
                    label="Episode Title"
                    placeholder="Enter episode title"
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
                    label="Description"
                    placeholder="Enter episode description"
                    multiline
                    rows={4}
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.description && Boolean(formik.errors.description)}
                    helperText={
                      (formik.touched.description && formik.errors.description) ||
                      `${(formik.values.description || '').length}/2000 characters`
                    }
                  />

                  {/* Audio Upload */}
                  <AudioUpload
                    label="Ses Dosyası"
                    prefix="episodes"
                    currentAudioUrl={formik.values.audioUrl || undefined}
                    currentFileName={episode?.title ? `${episode.title}.mp3` : undefined}
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
                  {formik.touched.audioUrl && formik.errors.audioUrl && (
                    <Typography variant="caption" color="error">
                      {formik.errors.audioUrl}
                    </Typography>
                  )}

                  {/* Video Upload */}
                  <VideoUpload
                    label="Video Dosyası / YouTube / Harici URL"
                    prefix="episodes"
                    currentVideoUrl={formik.values.videoUrl || undefined}
                    currentYoutubeUrl={formik.values.youtubeUrl || undefined}
                    currentExternalUrl={formik.values.externalVideoUrl || undefined}
                    currentFileName={episode?.title ? `${episode.title}.mp4` : undefined}
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

                  {/* Thumbnail Upload */}
                  <ImageUpload
                    label="Episode Kapak Resmi (Thumbnail)"
                    prefix="episodes/thumbnails"
                    currentImageUrl={formik.values.thumbnailUrl || undefined}
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

                  {/* Quality & Featured */}
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                      select
                      fullWidth
                      id="quality"
                      name="quality"
                      label="Video Kalitesi"
                      value={formik.values.quality}
                      onChange={formik.handleChange}
                      disabled={saving}
                    >
                      <MenuItem value="">Seçiniz</MenuItem>
                      {QUALITY_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>

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

                  <Stack direction="row" spacing={2}>
                    <TextField
                      fullWidth
                      id="duration"
                      name="duration"
                      label="Duration (seconds)"
                      type="number"
                      value={formik.values.duration}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.duration && Boolean(formik.errors.duration)}
                      helperText={
                        (formik.touched.duration && formik.errors.duration) ||
                        (formik.values.duration ? `${formatDuration(formik.values.duration)}` : '')
                      }
                    />
                    <TextField
                      fullWidth
                      id="seasonNumber"
                      name="seasonNumber"
                      label="Season #"
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
                      label="Episode #"
                      type="number"
                      value={formik.values.episodeNumber}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.episodeNumber && Boolean(formik.errors.episodeNumber)}
                      helperText={formik.touched.episodeNumber && formik.errors.episodeNumber}
                    />
                  </Stack>

                  {/* Podcast Info (Read-only) */}
                  {episode?.podcast && (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Podcast
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        {episode.podcast.coverImageUrl ? (
                          <Box
                            component="img"
                            src={episode.podcast.coverImageUrl}
                            alt={episode.podcast.title}
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
                        <Typography variant="subtitle1" fontWeight={600}>
                          {episode.podcast.title}
                        </Typography>
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Grid>

              <Grid item xs={12} md={4}>
                {/* Episode Stats */}
                {episode && (
                  <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2, mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Episode Info
                    </Typography>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Created</Typography>
                        <Typography variant="body2">{new Date(episode.createdAt).toLocaleDateString()}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Updated</Typography>
                        <Typography variant="body2">{new Date(episode.updatedAt).toLocaleDateString()}</Typography>
                      </Stack>
                      {episode.publishedAt && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Published</Typography>
                          <Typography variant="body2">{new Date(episode.publishedAt).toLocaleDateString()}</Typography>
                        </Stack>
                      )}
                    </Stack>
                  </Paper>
                )}
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/episodes')}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving || !formik.dirty}
                    startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={18} />}
                    sx={{ minWidth: 140 }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Episode</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{episode?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={18} color="inherit" /> : <IconTrash size={18} />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

export default EditEpisodePage;
