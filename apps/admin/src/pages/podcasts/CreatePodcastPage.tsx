import React, { useState } from 'react';
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
} from '@mui/material';
import { IconArrowLeft } from '@tabler/icons-react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { podcastService } from '../../api/services/podcast.service';
import { ImageUpload } from '../../components/upload';

const validationSchema = yup.object({
  title: yup.string().required('Title is required').min(3, 'Title must be at least 3 characters'),
  description: yup.string().required('Description is required').min(10, 'Description must be at least 10 characters'),
  categoryId: yup.string().required('Category is required'),
});

const categories = [
  { id: '1', name: 'Technology' },
  { id: '2', name: 'Education' },
  { id: '3', name: 'Health' },
  { id: '4', name: 'Sports' },
  { id: '5', name: 'Entertainment' },
  { id: '6', name: 'Business' },
  { id: '7', name: 'News' },
  { id: '8', name: 'Crime' },
];

const CreatePodcastPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      categoryId: '',
      coverImage: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);

      try {
        await podcastService.create(values);
        navigate('/podcasts');
      } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to create podcast';
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
          Back
        </Button>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Create Podcast
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add a new podcast to the platform
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
                        {formik.errors.categoryId}
                      </Typography>
                    )}
                  </FormControl>
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
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/podcasts')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{ minWidth: 120 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Podcast'}
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
