import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconMicrophone,
  IconUser,
  IconRefresh,
} from '@tabler/icons-react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { hocaService, Hoca, CreateHocaDto, UpdateHocaDto } from '../../api/services/hoca.service';

// Validation schema
const validationSchema = yup.object({
  name: yup.string().required('Name is required').min(2, 'At least 2 characters').max(100, 'Max 100 characters'),
  bio: yup.string().max(2000, 'Bio must be less than 2000 characters'),
  expertise: yup.string().max(200, 'Expertise must be less than 200 characters'),
  avatarUrl: yup.string().url('Must be a valid URL').nullable(),
});

type Order = 'asc' | 'desc';
type OrderBy = 'name' | 'expertise' | 'createdAt';

const HocasPage: React.FC = () => {
  // List state
  const [hocas, setHocas] = useState<Hoca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<OrderBy>('createdAt');

  // Menu & selection state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedHoca, setSelectedHoca] = useState<Hoca | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Formik setup
  const formik = useFormik({
    initialValues: {
      name: '',
      bio: '',
      expertise: '',
      avatarUrl: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setSaving(true);
      try {
        if (dialogMode === 'create') {
          const createData: CreateHocaDto = {
            name: values.name,
            bio: values.bio || undefined,
            expertise: values.expertise || undefined,
            avatarUrl: values.avatarUrl || undefined,
          };
          await hocaService.create(createData);
          setSnackbar({ open: true, message: 'Hoca created successfully', severity: 'success' });
        } else if (selectedHoca) {
          const updateData: UpdateHocaDto = {
            name: values.name,
            bio: values.bio || undefined,
            expertise: values.expertise || undefined,
            avatarUrl: values.avatarUrl || undefined,
          };
          await hocaService.update(selectedHoca.id, updateData);
          setSnackbar({ open: true, message: 'Hoca updated successfully', severity: 'success' });
        }
        handleCloseDialog();
        fetchHocas();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save hoca';
        setSnackbar({ open: true, message, severity: 'error' });
      } finally {
        setSaving(false);
      }
    },
  });

  // Fetch hocas
  const fetchHocas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await hocaService.list({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
      });
      setHocas(response.data || []);
      setTotal(response.total || 0);
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to load hocas';
      setError(errMessage);
      setHocas([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHocas();
  }, [page, rowsPerPage, search]);

  // Sort handler
  const handleSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Sort function
  const sortedHocas = [...hocas].sort((a, b) => {
    let aValue: string | number = a[orderBy] as string;
    let bValue: string | number = b[orderBy] as string;

    if (orderBy === 'createdAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = String(bValue || '').toLowerCase();
    }

    if (order === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, hoca: Hoca) => {
    setAnchorEl(event.currentTarget);
    setSelectedHoca(hoca);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Dialog handlers
  const handleOpenDialog = (mode: 'create' | 'edit') => {
    setDialogMode(mode);
    if (mode === 'edit' && selectedHoca) {
      formik.setValues({
        name: selectedHoca.name,
        bio: selectedHoca.bio || '',
        expertise: selectedHoca.expertise || '',
        avatarUrl: selectedHoca.avatarUrl || '',
      });
    } else {
      formik.resetForm();
    }
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    formik.resetForm();
  };

  // Delete handlers
  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedHoca) return;

    setDeleting(true);
    try {
      await hocaService.delete(selectedHoca.id);
      setSnackbar({ open: true, message: 'Hoca deleted successfully', severity: 'success' });
      setDeleteDialogOpen(false);
      setSelectedHoca(null);
      fetchHocas();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete hoca';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box>
      {/* Page Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Hocalar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage podcast hosts and mentors
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <Tooltip title="Refresh">
            <IconButton onClick={fetchHocas} disabled={loading}>
              <IconRefresh size={20} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<IconPlus size={20} />}
            onClick={() => handleOpenDialog('create')}
          >
            Add Hoca
          </Button>
        </Stack>
      </Stack>

      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Card */}
      <Card>
        <CardContent>
          {/* Search */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
            <TextField
              placeholder="Search by name..."
              size="small"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: { xs: '100%', sm: 300 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={20} />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>

          {/* Table */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'name'}
                          direction={orderBy === 'name' ? order : 'asc'}
                          onClick={() => handleSort('name')}
                        >
                          Hoca
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'expertise'}
                          direction={orderBy === 'expertise' ? order : 'asc'}
                          onClick={() => handleSort('expertise')}
                        >
                          Expertise
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Bio</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'createdAt'}
                          direction={orderBy === 'createdAt' ? order : 'asc'}
                          onClick={() => handleSort('createdAt')}
                        >
                          Created
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedHocas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Box py={6}>
                            <IconUser size={48} color="#ccc" />
                            <Typography color="text.secondary" mt={2}>
                              No hocas found
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Click "Add Hoca" to create your first hoca
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedHocas.map((hoca) => (
                        <TableRow key={hoca.id} hover>
                          <TableCell>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar
                                src={hoca.avatarUrl}
                                sx={{ width: 44, height: 44, bgcolor: 'primary.light' }}
                              >
                                {getInitials(hoca.name)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {hoca.name}
                                </Typography>
                                {hoca.user?.email && (
                                  <Typography variant="caption" color="text.secondary">
                                    {hoca.user.email}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            {hoca.expertise ? (
                              <Chip
                                label={hoca.expertise}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Tooltip title={hoca.bio || 'No bio'} arrow>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  maxWidth: 200,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {hoca.bio || '-'}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={hoca.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              color={hoca.isActive ? 'success' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(hoca.createdAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, hoca)}
                            >
                              <IconDotsVertical size={18} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => handleOpenDialog('edit')}>
          <IconEdit size={18} style={{ marginRight: 8 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleOpenDeleteDialog} sx={{ color: 'error.main' }}>
          <IconTrash size={18} style={{ marginRight: 8 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle>
            {dialogMode === 'create' ? 'Add New Hoca' : 'Edit Hoca'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                placeholder="Full name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
              />
              <TextField
                fullWidth
                label="Expertise"
                name="expertise"
                placeholder="e.g., Technology, Education, Personal Development"
                value={formik.values.expertise}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.expertise && Boolean(formik.errors.expertise)}
                helperText={formik.touched.expertise && formik.errors.expertise}
              />
              <TextField
                fullWidth
                label="Bio"
                name="bio"
                multiline
                rows={3}
                placeholder="Brief description about the hoca..."
                value={formik.values.bio}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.bio && Boolean(formik.errors.bio)}
                helperText={
                  (formik.touched.bio && formik.errors.bio) ||
                  `${formik.values.bio.length}/2000 characters`
                }
              />
              <TextField
                fullWidth
                label="Avatar URL"
                name="avatarUrl"
                placeholder="https://example.com/avatar.jpg"
                value={formik.values.avatarUrl}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.avatarUrl && Boolean(formik.errors.avatarUrl)}
                helperText={formik.touched.avatarUrl && formik.errors.avatarUrl}
              />
              {formik.values.avatarUrl && (
                <Box display="flex" justifyContent="center">
                  <Avatar
                    src={formik.values.avatarUrl}
                    sx={{ width: 80, height: 80 }}
                  >
                    {getInitials(formik.values.name || 'NA')}
                  </Avatar>
                </Box>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving || !formik.isValid}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {saving ? 'Saving...' : dialogMode === 'create' ? 'Create' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Hoca</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{selectedHoca?.name}</strong>?
            This action cannot be undone.
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

export default HocasPage;
