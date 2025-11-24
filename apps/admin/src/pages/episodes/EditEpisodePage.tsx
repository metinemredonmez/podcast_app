import React, { useState, useEffect, useRef } from 'react';
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
  Slider,
  IconButton,
  Paper,
} from '@mui/material';
import {
  IconArrowLeft,
  IconTrash,
  IconDeviceFloppy,
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconUpload,
  IconMicrophone,
} from '@tabler/icons-react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { episodeService, Episode, UpdateEpisodeDto } from '../../api/services/episode.service';
import { AudioUpload } from '../../components/upload';

const validationSchema = yup.object({
  title: yup.string().required('Title is required').min(3, 'Title must be at least 3 characters').max(160, 'Max 160 characters'),
  description: yup.string().max(2000, 'Description must be less than 2000 characters'),
  audioUrl: yup.string().url('Must be a valid URL').required('Audio URL is required'),
  duration: yup.number().min(1, 'Duration must be at least 1 second').required('Duration is required'),
  episodeNumber: yup.number().min(1, 'Must be at least 1').nullable(),
  seasonNumber: yup.number().min(1, 'Must be at least 1').nullable(),
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
  const audioRef = useRef<HTMLAudioElement>(null);

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

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

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
      duration: episode?.duration || 0,
      episodeNumber: episode?.episodeNumber || '',
      seasonNumber: episode?.seasonNumber || '',
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
          audioUrl: values.audioUrl,
          duration: values.duration,
          episodeNumber: values.episodeNumber ? Number(values.episodeNumber) : undefined,
          seasonNumber: values.seasonNumber ? Number(values.seasonNumber) : undefined,
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

  // Audio player handlers
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleSliderChange = (_: Event, value: number | number[]) => {
    if (audioRef.current && typeof value === 'number') {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
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
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={formik.values.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

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

                  <TextField
                    fullWidth
                    id="audioUrl"
                    name="audioUrl"
                    label="Audio URL"
                    placeholder="https://example.com/audio.mp3"
                    value={formik.values.audioUrl}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.audioUrl && Boolean(formik.errors.audioUrl)}
                    helperText={formik.touched.audioUrl && formik.errors.audioUrl}
                  />

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
                {/* Audio Player */}
                <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Audio Preview
                  </Typography>

                  {formik.values.audioUrl ? (
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                        <IconButton
                          onClick={togglePlay}
                          sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'primary.dark' },
                          }}
                        >
                          {isPlaying ? <IconPlayerPause size={24} /> : <IconPlayerPlay size={24} />}
                        </IconButton>
                        <Box flex={1}>
                          <Typography variant="body2" fontWeight={600}>
                            {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(audioDuration || formik.values.duration))}
                          </Typography>
                        </Box>
                      </Stack>

                      <Slider
                        value={currentTime}
                        max={audioDuration || formik.values.duration}
                        onChange={handleSliderChange}
                        sx={{ mb: 2 }}
                      />

                      <Typography variant="caption" color="text.secondary">
                        Click play to preview the audio
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        border: '2px dashed',
                        borderColor: 'divider',
                        borderRadius: 2,
                        p: 3,
                        textAlign: 'center',
                      }}
                    >
                      <IconUpload size={32} color="#ccc" />
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        Enter audio URL to preview
                      </Typography>
                    </Box>
                  )}
                </Paper>

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
