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
} from '@mui/material';
import {
  IconArrowLeft,
  IconTrash,
  IconDeviceFloppy,
  IconPlayerPlay,
  IconPlayerPause,
  IconArchive,
} from '@tabler/icons-react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { podcastService, Podcast, UpdatePodcastDto } from '../../api/services/podcast.service';
import { categoryService, Category } from '../../api/services/category.service';
import { ImageUpload } from '../../components/upload';

const validationSchema = yup.object({
  title: yup.string().required('Title is required').min(3, 'Title must be at least 3 characters'),
  description: yup.string().required('Description is required').min(10, 'Description must be at least 10 characters'),
  categoryId: yup.string().required('Category is required'),
});

type PodcastStatus = 'draft' | 'published' | 'archived';

const statusConfig: Record<PodcastStatus, { color: 'default' | 'success' | 'warning'; label: string }> = {
  draft: { color: 'default', label: 'Draft' },
  published: { color: 'success', label: 'Published' },
  archived: { color: 'warning', label: 'Archived' },
};

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

  // Fetch podcast and categories
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('Podcast ID not found');
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
        const message = err.response?.data?.message || 'Failed to load podcast';
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
      categoryId: (podcast as any)?.categoryId || '',
      coverImage: podcast?.coverImage || '',
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
          description: values.description,
          categoryId: values.categoryId,
        };

        if (values.coverImage) {
          updateData.coverImage = values.coverImage;
        }

        const updated = await podcastService.update(id, updateData);
        setPodcast(updated);
        setSnackbar({ open: true, message: 'Podcast updated successfully', severity: 'success' });
      } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to update podcast';
        setError(message);
        setSnackbar({ open: true, message, severity: 'error' });
      } finally {
        setSaving(false);
      }
    },
  });

  // Status change handler
  const handleStatusChange = async (newStatus: PodcastStatus) => {
    if (!id || !podcast) return;

    setSaving(true);
    try {
      const updated = await podcastService.update(id, { status: newStatus });
      setPodcast(updated);
      setSnackbar({
        open: true,
        message: `Podcast ${newStatus === 'published' ? 'published' : newStatus === 'archived' ? 'archived' : 'set to draft'} successfully`,
        severity: 'success'
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
      await podcastService.delete(id);
      setSnackbar({ open: true, message: 'Podcast deleted successfully', severity: 'success' });
      setTimeout(() => navigate('/podcasts'), 500);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete podcast';
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
            onClick={() => navigate('/podcasts')}
            color="inherit"
          >
            Back
          </Button>
          <Box>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="h4" fontWeight={600}>
                Edit Podcast
              </Typography>
              {podcast && (
                <Chip
                  label={statusConfig[podcast.status].label}
                  color={statusConfig[podcast.status].color}
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
          {podcast?.status === 'draft' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<IconPlayerPlay size={18} />}
              onClick={() => handleStatusChange('published')}
              disabled={saving}
            >
              Publish
            </Button>
          )}
          {podcast?.status === 'published' && (
            <>
              <Button
                variant="outlined"
                startIcon={<IconPlayerPause size={18} />}
                onClick={() => handleStatusChange('draft')}
                disabled={saving}
              >
                Unpublish
              </Button>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<IconArchive size={18} />}
                onClick={() => handleStatusChange('archived')}
                disabled={saving}
              >
                Archive
              </Button>
            </>
          )}
          {podcast?.status === 'archived' && (
            <Button
              variant="outlined"
              startIcon={<IconPlayerPlay size={18} />}
              onClick={() => handleStatusChange('draft')}
              disabled={saving}
            >
              Restore to Draft
            </Button>
          )}
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
                    label="Podcast Title"
                    placeholder="Enter podcast title"
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
                    placeholder="Enter podcast description"
                    multiline
                    rows={4}
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.description && Boolean(formik.errors.description)}
                    helperText={formik.touched.description && formik.errors.description}
                  />

                  <FormControl fullWidth error={formik.touched.categoryId && Boolean(formik.errors.categoryId)}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      id="categoryId"
                      name="categoryId"
                      label="Category"
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

                  {/* Podcast Stats (Read-only) */}
                  {podcast && (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Podcast Statistics
                      </Typography>
                      <Stack direction="row" spacing={4}>
                        <Box>
                          <Typography variant="h6">{podcast.episodeCount || 0}</Typography>
                          <Typography variant="caption" color="text.secondary">Episodes</Typography>
                        </Box>
                        <Box>
                          <Typography variant="h6">{podcast.totalPlays?.toLocaleString() || 0}</Typography>
                          <Typography variant="caption" color="text.secondary">Total Plays</Typography>
                        </Box>
                        <Box>
                          <Typography variant="h6">
                            {new Date(podcast.createdAt).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Created</Typography>
                        </Box>
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Grid>

              <Grid item xs={12} md={4}>
                <ImageUpload
                  label="Cover Image"
                  prefix="podcast-covers"
                  aspectRatio="1:1"
                  previewWidth={200}
                  currentImageUrl={formik.values.coverImage || undefined}
                  onUploadComplete={(response) => {
                    formik.setFieldValue('coverImage', response.url);
                  }}
                  onRemove={() => {
                    formik.setFieldValue('coverImage', '');
                  }}
                  disabled={saving}
                />
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/podcasts')}
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
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Podcast</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{podcast?.title}"? This action cannot be undone.
            All episodes associated with this podcast will also be deleted.
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
