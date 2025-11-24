import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Avatar,
  Stack,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Menu,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Snackbar,
  Skeleton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  IconSearch,
  IconPlus,
  IconDotsVertical,
  IconEye,
  IconPlayerPlay,
  IconPlayerPause,
  IconCrown,
  IconUserCheck,
  IconBuilding,
  IconUsers,
  IconClock,
  IconTrendingUp,
  IconTrash,
  IconEdit,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  tenantService,
  Tenant,
  TenantStats,
  TenantStatus,
  TenantPlan,
  CreateTenantDto,
} from '../../api/services/tenant.service';

// Status config
const statusConfig: Record<TenantStatus, { color: 'success' | 'error' | 'warning'; label: string }> = {
  active: { color: 'success', label: 'Active' },
  suspended: { color: 'error', label: 'Suspended' },
  trial: { color: 'warning', label: 'Trial' },
};

// Plan config
const planConfig: Record<TenantPlan, { color: 'default' | 'primary' | 'secondary'; label: string; icon: React.ReactNode }> = {
  free: { color: 'default', label: 'Free', icon: null },
  pro: { color: 'primary', label: 'Pro', icon: <IconCrown size={14} /> },
  enterprise: { color: 'secondary', label: 'Enterprise', icon: <IconBuilding size={14} /> },
};

// Validation schema
const createTenantSchema = yup.object({
  name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  domain: yup.string().required('Domain is required').matches(/^[a-z0-9-]+$/, 'Domain can only contain lowercase letters, numbers, and hyphens'),
  adminEmail: yup.string().required('Admin email is required').email('Invalid email format'),
  plan: yup.string().oneOf(['free', 'pro', 'enterprise']).required('Plan is required'),
});

// Format bytes to readable size
const formatStorage = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const TenantsPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [planFilter, setPlanFilter] = useState<string>('');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTenant, setMenuTenant] = useState<Tenant | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch tenants
  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tenantService.list({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        status: statusFilter as TenantStatus || undefined,
        plan: planFilter as TenantPlan || undefined,
      });
      setTenants(response.data);
      setTotal(response.total);
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to load tenants',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter, planFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await tenantService.getStats();
      setStats(data);
    } catch {
      // Stats fetch failed silently
    }
  }, []);

  useEffect(() => {
    fetchTenants();
    fetchStats();
  }, [fetchTenants, fetchStats]);

  // Formik for create tenant
  const formik = useFormik<CreateTenantDto>({
    initialValues: {
      name: '',
      domain: '',
      adminEmail: '',
      plan: 'free',
    },
    validationSchema: createTenantSchema,
    onSubmit: async (values, { resetForm }) => {
      setActionLoading(true);
      try {
        await tenantService.create(values);
        setSnackbar({ open: true, message: 'Tenant created successfully', severity: 'success' });
        setCreateDialogOpen(false);
        resetForm();
        fetchTenants();
        fetchStats();
      } catch (err: any) {
        setSnackbar({
          open: true,
          message: err.response?.data?.message || 'Failed to create tenant',
          severity: 'error',
        });
      } finally {
        setActionLoading(false);
      }
    },
  });

  // Action handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, tenant: Tenant) => {
    setAnchorEl(event.currentTarget);
    setMenuTenant(tenant);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTenant(null);
  };

  const handleSuspend = async () => {
    if (!menuTenant) return;
    handleMenuClose();
    setActionLoading(true);
    try {
      await tenantService.suspend(menuTenant.id);
      setSnackbar({ open: true, message: 'Tenant suspended', severity: 'success' });
      fetchTenants();
      fetchStats();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to suspend tenant', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!menuTenant) return;
    handleMenuClose();
    setActionLoading(true);
    try {
      await tenantService.activate(menuTenant.id);
      setSnackbar({ open: true, message: 'Tenant activated', severity: 'success' });
      fetchTenants();
      fetchStats();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to activate tenant', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleImpersonate = async () => {
    if (!menuTenant) return;
    handleMenuClose();
    try {
      const result = await tenantService.impersonate(menuTenant.id);
      // Open in new tab
      window.open(result.redirectUrl, '_blank');
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to impersonate', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!selectedTenant) return;
    setActionLoading(true);
    try {
      await tenantService.delete(selectedTenant.id);
      setSnackbar({ open: true, message: 'Tenant deleted', severity: 'success' });
      setDeleteDialogOpen(false);
      setSelectedTenant(null);
      fetchTenants();
      fetchStats();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to delete tenant', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePlan = async (plan: TenantPlan) => {
    if (!menuTenant) return;
    handleMenuClose();
    setActionLoading(true);
    try {
      await tenantService.changePlan(menuTenant.id, plan);
      setSnackbar({ open: true, message: `Plan changed to ${plan}`, severity: 'success' });
      fetchTenants();
      fetchStats();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to change plan', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Stat cards
  const statCards = [
    {
      title: 'Total Tenants',
      value: stats?.total || 0,
      icon: <IconBuilding size={24} />,
      color: '#5D87FF',
    },
    {
      title: 'Active Tenants',
      value: stats?.active || 0,
      icon: <IconUsers size={24} />,
      color: '#13DEB9',
    },
    {
      title: 'Trial Ending Soon',
      value: stats?.trialEndingSoon || 0,
      icon: <IconClock size={24} />,
      color: '#FFAE1F',
      subtitle: 'Next 7 days',
    },
    {
      title: 'Monthly Revenue',
      value: stats?.totalRevenue ? `$${stats.totalRevenue.toLocaleString()}` : '$0',
      icon: <IconTrendingUp size={24} />,
      color: '#FA896B',
    },
  ];

  return (
    <Box>
      {/* Page Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Tenant Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage all tenants and their subscriptions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<IconPlus size={20} />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Add Tenant
        </Button>
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" fontWeight={600} mt={0.5}>
                      {loading ? <Skeleton width={60} /> : stat.value}
                    </Typography>
                    {stat.subtitle && (
                      <Typography variant="caption" color="text.secondary">
                        {stat.subtitle}
                      </Typography>
                    )}
                  </Box>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: `${stat.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: stat.color,
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              placeholder="Search by name or domain..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={20} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="trial">Trial</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Plan</InputLabel>
              <Select
                value={planFilter}
                label="Plan"
                onChange={(e) => setPlanFilter(e.target.value)}
              >
                <MenuItem value="">All Plans</MenuItem>
                <MenuItem value="free">Free</MenuItem>
                <MenuItem value="pro">Pro</MenuItem>
                <MenuItem value="enterprise">Enterprise</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        {actionLoading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tenant</TableCell>
                <TableCell>Domain</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Users</TableCell>
                <TableCell>Storage</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton variant="text" width={150} /></TableCell>
                    <TableCell><Skeleton variant="text" width={100} /></TableCell>
                    <TableCell><Skeleton variant="rectangular" width={80} height={24} /></TableCell>
                    <TableCell><Skeleton variant="rectangular" width={70} height={24} /></TableCell>
                    <TableCell align="center"><Skeleton variant="text" width={30} /></TableCell>
                    <TableCell><Skeleton variant="text" width={100} /></TableCell>
                    <TableCell><Skeleton variant="text" width={80} /></TableCell>
                    <TableCell><Skeleton variant="circular" width={32} height={32} /></TableCell>
                  </TableRow>
                ))
              ) : tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No tenants found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          src={tenant.logo}
                          alt={tenant.name}
                          sx={{ width: 40, height: 40, bgcolor: 'primary.light' }}
                        >
                          {tenant.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {tenant.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tenant.adminEmail}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {tenant.domain || tenant.slug || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={tenant.plan && planConfig[tenant.plan] ? planConfig[tenant.plan].icon as React.ReactElement : null}
                        label={tenant.plan && planConfig[tenant.plan] ? planConfig[tenant.plan].label : 'N/A'}
                        color={tenant.plan && planConfig[tenant.plan] ? planConfig[tenant.plan].color : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tenant.status && statusConfig[tenant.status] ? statusConfig[tenant.status].label : 'Active'}
                        color={tenant.status && statusConfig[tenant.status] ? statusConfig[tenant.status].color : 'success'}
                        size="small"
                        variant="outlined"
                      />
                      {tenant.status === 'trial' && tenant.trialEndsAt && (
                        <Typography variant="caption" display="block" color="warning.main">
                          Ends {new Date(tenant.trialEndsAt).toLocaleDateString()}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{tenant.userCount || 0}</Typography>
                    </TableCell>
                    <TableCell>
                      {tenant.storageUsed !== undefined && tenant.storageLimit !== undefined ? (
                        <Box sx={{ width: 100 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatStorage(tenant.storageUsed)} / {formatStorage(tenant.storageLimit)}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(tenant.storageUsed / tenant.storageLimit) * 100}
                            sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
                            color={tenant.storageUsed / tenant.storageLimit > 0.9 ? 'error' : 'primary'}
                          />
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/tenants/${tenant.id}`)}
                        >
                          <IconEye size={18} />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, tenant)}
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
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleMenuClose(); navigate(`/tenants/${menuTenant?.id}`); }}>
          <ListItemIcon><IconEye size={18} /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); navigate(`/tenants/${menuTenant?.id}/edit`); }}>
          <ListItemIcon><IconEdit size={18} /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        {menuTenant?.status === 'active' || menuTenant?.status === 'trial' ? (
          <MenuItem onClick={handleSuspend}>
            <ListItemIcon><IconPlayerPause size={18} /></ListItemIcon>
            <ListItemText>Suspend</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={handleActivate}>
            <ListItemIcon><IconPlayerPlay size={18} /></ListItemIcon>
            <ListItemText>Activate</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleImpersonate}>
          <ListItemIcon><IconUserCheck size={18} /></ListItemIcon>
          <ListItemText>Impersonate</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleChangePlan('pro')} disabled={menuTenant?.plan === 'pro'}>
          <ListItemIcon><IconCrown size={18} /></ListItemIcon>
          <ListItemText>Upgrade to Pro</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSelectedTenant(menuTenant);
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><IconTrash size={18} color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Tenant Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle>Create New Tenant</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Tenant Name"
                placeholder="e.g., Acme Corporation"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
              />
              <TextField
                fullWidth
                id="domain"
                name="domain"
                label="Domain"
                placeholder="e.g., acme"
                value={formik.values.domain}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.domain && Boolean(formik.errors.domain)}
                helperText={(formik.touched.domain && formik.errors.domain) || 'Subdomain for the tenant (lowercase, no spaces)'}
                InputProps={{
                  endAdornment: <InputAdornment position="end">.yourapp.com</InputAdornment>,
                }}
              />
              <TextField
                fullWidth
                id="adminEmail"
                name="adminEmail"
                label="Admin Email"
                placeholder="admin@company.com"
                type="email"
                value={formik.values.adminEmail}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.adminEmail && Boolean(formik.errors.adminEmail)}
                helperText={formik.touched.adminEmail && formik.errors.adminEmail}
              />
              <FormControl fullWidth error={formik.touched.plan && Boolean(formik.errors.plan)}>
                <InputLabel>Plan</InputLabel>
                <Select
                  id="plan"
                  name="plan"
                  label="Plan"
                  value={formik.values.plan}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <MenuItem value="free">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <span>Free</span>
                      <Typography variant="caption" color="text.secondary">- 1GB storage, 5 users</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="pro">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <IconCrown size={16} />
                      <span>Pro</span>
                      <Typography variant="caption" color="text.secondary">- 10GB storage, 25 users</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="enterprise">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <IconBuilding size={16} />
                      <span>Enterprise</span>
                      <Typography variant="caption" color="text.secondary">- 100GB storage, unlimited users</Typography>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={actionLoading}>
              {actionLoading ? 'Creating...' : 'Create Tenant'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Tenant</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action cannot be undone!
          </Alert>
          <Typography>
            Are you sure you want to delete <strong>{selectedTenant?.name}</strong>?
            This will permanently remove all data associated with this tenant.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? 'Deleting...' : 'Delete Tenant'}
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

export default TenantsPage;
