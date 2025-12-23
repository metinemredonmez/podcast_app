import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Grid,
  Chip,
  Avatar,
  Divider,
  LinearProgress,
  Alert,
  Snackbar,
  Skeleton,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Switch,
  FormControlLabel,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  IconArrowLeft,
  IconBuilding,
  IconUsers,
  IconMicrophone,
  IconCloud,
  IconCalendar,
  IconMail,
  IconWorld,
  IconCrown,
  IconPlayerPlay,
  IconPlayerPause,
  IconUserCheck,
  IconEdit,
  IconTrash,
  IconClock,
  IconPlus,
  IconHeadphones,
  IconWifi,
  IconCreditCard,
  IconKey,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconRefresh,
  IconCheck,
  IconX,
  IconLogin,
  IconLogout,
  IconSettings,
  IconAlertCircle,
} from '@tabler/icons-react';
import {
  tenantService,
  Tenant,
  TenantPlan,
  TenantStatus,
  TenantUser,
  TenantApiKey,
  TenantActivity,
  TenantLoginHistory,
  UpdateTenantDto,
} from '../../api/services/tenant.service';
import { ImageUpload } from '../../components/upload';

// Status config
const statusConfig: Record<TenantStatus, { color: 'success' | 'error' | 'warning'; label: string }> = {
  active: { color: 'success', label: 'Active' },
  suspended: { color: 'error', label: 'Suspended' },
  trial: { color: 'warning', label: 'Trial' },
};

// Plan config
const planConfig: Record<TenantPlan, { color: 'default' | 'primary' | 'secondary'; label: string }> = {
  free: { color: 'default', label: 'Free' },
  pro: { color: 'primary', label: 'Pro' },
  enterprise: { color: 'secondary', label: 'Enterprise' },
};

// Role config
const roleConfig: Record<string, { color: 'error' | 'primary' | 'secondary' | 'default'; label: string }> = {
  owner: { color: 'error', label: 'Owner' },
  admin: { color: 'primary', label: 'Admin' },
  editor: { color: 'secondary', label: 'Editor' },
  viewer: { color: 'default', label: 'Viewer' },
};

// Activity type icons
const activityIcons: Record<string, React.ReactNode> = {
  login: <IconLogin size={16} />,
  logout: <IconLogout size={16} />,
  create: <IconPlus size={16} />,
  update: <IconEdit size={16} />,
  delete: <IconTrash size={16} />,
  settings: <IconSettings size={16} />,
  billing: <IconCreditCard size={16} />,
};

// Format bytes
const formatStorage = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const TenantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [apiKeys, setApiKeys] = useState<TenantApiKey[]>([]);
  const [activities, setActivities] = useState<TenantActivity[]>([]);
  const [loginHistory, setLoginHistory] = useState<TenantLoginHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [extendTrialDialogOpen, setExtendTrialDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [newApiKeyDialog, setNewApiKeyDialog] = useState<{ open: boolean; key?: string }>({ open: false });
  const [trialDays, setTrialDays] = useState(7);
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<TenantUser['role']>('viewer');
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [activityTab, setActivityTab] = useState(0); // 0: Activity, 1: Login History

  // Edit form state
  const [editForm, setEditForm] = useState<UpdateTenantDto>({});

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch tenant data
  const fetchTenant = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await tenantService.get(id);
      setTenant(data);
      setEditForm({
        name: data.name,
        domain: data.domain,
        adminEmail: data.adminEmail,
        logo: data.logo,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tenant';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchUsers = useCallback(async () => {
    if (!id) return;
    try {
      const data = await tenantService.getUsers(id);
      setUsers(data);
    } catch {
      // Users fetch failed silently
    }
  }, [id]);

  const fetchApiKeys = useCallback(async () => {
    if (!id) return;
    try {
      const data = await tenantService.getApiKeys(id);
      setApiKeys(data);
    } catch {
      setApiKeys([]);
    }
  }, [id]);

  const fetchActivity = useCallback(async () => {
    if (!id) return;
    try {
      const data = await tenantService.getActivity(id);
      setActivities(data.data);
    } catch {
      setActivities([]);
    }
  }, [id]);

  const fetchLoginHistory = useCallback(async () => {
    if (!id) return;
    try {
      const data = await tenantService.getLoginHistory(id);
      setLoginHistory(data.data);
    } catch {
      setLoginHistory([]);
    }
  }, [id]);

  useEffect(() => {
    fetchTenant();
    fetchUsers();
    fetchApiKeys();
    fetchActivity();
    fetchLoginHistory();
  }, [fetchTenant, fetchUsers, fetchApiKeys, fetchActivity, fetchLoginHistory]);

  // Action handlers
  const handleSuspend = async () => {
    if (!tenant) return;
    setActionLoading(true);
    try {
      const updated = await tenantService.suspend(tenant.id);
      setTenant(updated);
      setSnackbar({ open: true, message: 'Tenant suspended', severity: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to suspend';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!tenant) return;
    setActionLoading(true);
    try {
      const updated = await tenantService.activate(tenant.id);
      setTenant(updated);
      setSnackbar({ open: true, message: 'Tenant activated', severity: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to activate';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleImpersonate = async () => {
    if (!tenant) return;
    try {
      const result = await tenantService.impersonate(tenant.id);
      window.open(result.redirectUrl, '_blank');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to impersonate';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  const handleUpdate = async () => {
    if (!tenant) return;
    setActionLoading(true);
    try {
      const updated = await tenantService.update(tenant.id, editForm);
      setTenant(updated);
      setEditDialogOpen(false);
      setSnackbar({ open: true, message: 'Tenant updated', severity: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tenant) return;
    setActionLoading(true);
    try {
      await tenantService.delete(tenant.id);
      setSnackbar({ open: true, message: 'Tenant deleted', severity: 'success' });
      setTimeout(() => navigate('/tenants'), 500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleChangePlan = async (plan: TenantPlan) => {
    if (!tenant) return;
    setActionLoading(true);
    try {
      const updated = await tenantService.changePlan(tenant.id, plan);
      setTenant(updated);
      setPlanDialogOpen(false);
      setSnackbar({ open: true, message: `Plan changed to ${plan}`, severity: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to change plan';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendTrial = async () => {
    if (!tenant) return;
    setActionLoading(true);
    try {
      const updated = await tenantService.extendTrial(tenant.id, trialDays);
      setTenant(updated);
      setExtendTrialDialogOpen(false);
      setSnackbar({ open: true, message: `Trial extended by ${trialDays} days`, severity: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to extend trial';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!tenant || !selectedUser) return;
    setActionLoading(true);
    try {
      await tenantService.updateUserRole(tenant.id, selectedUser.id, selectedRole);
      setRoleDialogOpen(false);
      fetchUsers();
      setSnackbar({ open: true, message: 'User role updated', severity: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update role';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!tenant) return;
    setActionLoading(true);
    try {
      await tenantService.removeUser(tenant.id, userId);
      fetchUsers();
      setSnackbar({ open: true, message: 'User removed', severity: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove user';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!tenant || !newApiKeyName) return;
    setActionLoading(true);
    try {
      const result = await tenantService.createApiKey(tenant.id, { name: newApiKeyName, permissions: ['read', 'write'] });
      setApiKeyDialogOpen(false);
      setNewApiKeyDialog({ open: true, key: result.fullKey });
      setNewApiKeyName('');
      fetchApiKeys();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create API key';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    if (!tenant) return;
    setActionLoading(true);
    try {
      await tenantService.revokeApiKey(tenant.id, keyId);
      fetchApiKeys();
      setSnackbar({ open: true, message: 'API key revoked', severity: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to revoke API key';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSetting = async (setting: string, value: boolean) => {
    if (!tenant) return;
    setActionLoading(true);
    try {
      const updated = await tenantService.updateSettings(tenant.id, { [setting]: value });
      setTenant(updated);
      setSnackbar({ open: true, message: 'Setting updated', severity: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update setting';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: 'Copied to clipboard', severity: 'success' });
  };

  // Loading skeleton
  if (loading) {
    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Skeleton variant="rectangular" width={80} height={36} />
          <Skeleton variant="text" width={200} height={40} />
        </Stack>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={500} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={500} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Error state
  if (error && !tenant) {
    return (
      <Box>
        <Button startIcon={<IconArrowLeft size={20} />} onClick={() => navigate('/tenants')} color="inherit" sx={{ mb: 2 }}>
          Back
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!tenant) return null;

  return (
    <Box>
      {/* Page Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button startIcon={<IconArrowLeft size={20} />} onClick={() => navigate('/tenants')} color="inherit">
            Back
          </Button>
          <Avatar src={tenant.logo} alt={tenant.name} sx={{ width: 48, height: 48 }}>
            {tenant.name.charAt(0)}
          </Avatar>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              <Typography variant="h4" fontWeight={600}>
                {tenant.name}
              </Typography>
              <Chip label={statusConfig[tenant.status].label} color={statusConfig[tenant.status].color} size="small" />
              <Chip label={planConfig[tenant.plan].label} color={planConfig[tenant.plan].color} size="small" variant="outlined" />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {tenant.domain}.yourapp.com
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {tenant.status === 'trial' && (
            <Button variant="outlined" startIcon={<IconPlus size={18} />} onClick={() => setExtendTrialDialogOpen(true)} disabled={actionLoading}>
              Extend Trial
            </Button>
          )}
          {tenant.status === 'active' || tenant.status === 'trial' ? (
            <Button variant="outlined" color="warning" startIcon={<IconPlayerPause size={18} />} onClick={handleSuspend} disabled={actionLoading}>
              Suspend
            </Button>
          ) : (
            <Button variant="outlined" color="success" startIcon={<IconPlayerPlay size={18} />} onClick={handleActivate} disabled={actionLoading}>
              Activate
            </Button>
          )}
          <Button variant="outlined" startIcon={<IconUserCheck size={18} />} onClick={handleImpersonate}>
            Impersonate
          </Button>
          <Button variant="outlined" startIcon={<IconEdit size={18} />} onClick={() => setEditDialogOpen(true)}>
            Edit
          </Button>
          <Button variant="outlined" color="error" startIcon={<IconTrash size={18} />} onClick={() => setDeleteDialogOpen(true)}>
            Delete
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* Left Column - Info Card */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Tenant Info */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Tenant Information
                </Typography>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ p: 1, bgcolor: 'primary.lighter', borderRadius: 1 }}><IconBuilding size={20} color="#5D87FF" /></Box>
                    <Box><Typography variant="caption" color="text.secondary">Name</Typography><Typography variant="body2" fontWeight={500}>{tenant.name}</Typography></Box>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ p: 1, bgcolor: 'success.lighter', borderRadius: 1 }}><IconWorld size={20} color="#13DEB9" /></Box>
                    <Box><Typography variant="caption" color="text.secondary">Domain</Typography><Typography variant="body2" fontWeight={500}>{tenant.domain}.yourapp.com</Typography></Box>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ p: 1, bgcolor: 'warning.lighter', borderRadius: 1 }}><IconMail size={20} color="#FFAE1F" /></Box>
                    <Box><Typography variant="caption" color="text.secondary">Admin Email</Typography><Typography variant="body2" fontWeight={500}>{tenant.adminEmail}</Typography></Box>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ p: 1, bgcolor: 'error.lighter', borderRadius: 1 }}><IconCalendar size={20} color="#FA896B" /></Box>
                    <Box><Typography variant="caption" color="text.secondary">Created</Typography><Typography variant="body2" fontWeight={500}>{new Date(tenant.createdAt).toLocaleDateString()}</Typography></Box>
                  </Stack>
                  {tenant.status === 'trial' && tenant.trialEndsAt && (
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ p: 1, bgcolor: 'warning.lighter', borderRadius: 1 }}><IconClock size={20} color="#FFAE1F" /></Box>
                      <Box><Typography variant="caption" color="text.secondary">Trial Ends</Typography><Typography variant="body2" fontWeight={500} color="warning.main">{new Date(tenant.trialEndsAt).toLocaleDateString()}</Typography></Box>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Billing Info */}
            {tenant.billing && (
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={2}>
                    Billing Information
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ p: 1, bgcolor: 'secondary.lighter', borderRadius: 1 }}><IconCrown size={20} color="#5D87FF" /></Box>
                      <Box><Typography variant="caption" color="text.secondary">Plan</Typography><Typography variant="body2" fontWeight={500}>{tenant.billing.plan} ({tenant.billing.interval})</Typography></Box>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ p: 1, bgcolor: 'success.lighter', borderRadius: 1 }}><IconCreditCard size={20} color="#13DEB9" /></Box>
                      <Box><Typography variant="caption" color="text.secondary">Amount</Typography><Typography variant="body2" fontWeight={500}>${(tenant.billing.amount / 100).toFixed(2)} {tenant.billing.currency}/{tenant.billing.interval === 'yearly' ? 'year' : 'month'}</Typography></Box>
                    </Stack>
                    {tenant.billing.paymentMethod && (
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ p: 1, bgcolor: 'info.lighter', borderRadius: 1 }}><IconCreditCard size={20} color="#5D87FF" /></Box>
                        <Box><Typography variant="caption" color="text.secondary">Payment Method</Typography><Typography variant="body2" fontWeight={500}>{tenant.billing.paymentMethod}</Typography></Box>
                      </Stack>
                    )}
                    {tenant.billing.nextBillingDate && (
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ p: 1, bgcolor: 'warning.lighter', borderRadius: 1 }}><IconCalendar size={20} color="#FFAE1F" /></Box>
                        <Box><Typography variant="caption" color="text.secondary">Next Billing</Typography><Typography variant="body2" fontWeight={500}>{new Date(tenant.billing.nextBillingDate).toLocaleDateString()}</Typography></Box>
                      </Stack>
                    )}
                  </Stack>
                  <Button size="small" onClick={() => setPlanDialogOpen(true)} sx={{ mt: 2 }}>Change Plan</Button>
                </CardContent>
              </Card>
            )}

            {/* Usage Statistics */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Usage Statistics
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Stack direction="row" alignItems="center" spacing={1}><IconUsers size={16} /><Typography variant="body2">Users</Typography></Stack>
                      <Typography variant="body2" fontWeight={500}>{tenant.userCount} / {tenant.settings?.maxUsers || '∞'}</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={tenant.settings?.maxUsers ? (tenant.userCount / tenant.settings.maxUsers) * 100 : 50} sx={{ height: 6, borderRadius: 3 }} />
                  </Box>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Stack direction="row" alignItems="center" spacing={1}><IconMicrophone size={16} /><Typography variant="body2">Podcasts</Typography></Stack>
                      <Typography variant="body2" fontWeight={500}>{tenant.podcastCount} / {tenant.settings?.maxPodcasts || '∞'}</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={tenant.settings?.maxPodcasts ? (tenant.podcastCount / tenant.settings.maxPodcasts) * 100 : 25} color="secondary" sx={{ height: 6, borderRadius: 3 }} />
                  </Box>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Stack direction="row" alignItems="center" spacing={1}><IconHeadphones size={16} /><Typography variant="body2">Episodes</Typography></Stack>
                      <Typography variant="body2" fontWeight={500}>{tenant.episodeCount}</Typography>
                    </Stack>
                  </Box>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Stack direction="row" alignItems="center" spacing={1}><IconCloud size={16} /><Typography variant="body2">Storage</Typography></Stack>
                      <Typography variant="body2" fontWeight={500}>{formatStorage(tenant.storageUsed)} / {formatStorage(tenant.storageLimit)}</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={(tenant.storageUsed / tenant.storageLimit) * 100} color={tenant.storageUsed / tenant.storageLimit > 0.9 ? 'error' : 'success'} sx={{ height: 6, borderRadius: 3 }} />
                  </Box>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Stack direction="row" alignItems="center" spacing={1}><IconWifi size={16} /><Typography variant="body2">Bandwidth</Typography></Stack>
                      <Typography variant="body2" fontWeight={500}>{formatStorage(tenant.bandwidthUsed)} / {formatStorage(tenant.bandwidthLimit)}</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={(tenant.bandwidthUsed / tenant.bandwidthLimit) * 100} color={tenant.bandwidthUsed / tenant.bandwidthLimit > 0.9 ? 'error' : 'info'} sx={{ height: 6, borderRadius: 3 }} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right Column - Tabs */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                <Tab label="Users" />
                <Tab label="Activity Log" />
                <Tab label="Settings" />
              </Tabs>

              {/* Users Tab */}
              <TabPanel value={tabValue} index={0}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Last Active</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Avatar src={user.avatar} sx={{ width: 32, height: 32 }}>{user.name.charAt(0)}</Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>{user.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip label={roleConfig[user.role]?.label || user.role} size="small" color={roleConfig[user.role]?.color || 'default'} />
                          </TableCell>
                          <TableCell>
                            <Chip label={user.status} size="small" color={user.status === 'active' ? 'success' : user.status === 'invited' ? 'warning' : 'default'} variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : 'Never'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Change Role">
                              <IconButton size="small" onClick={() => { setSelectedUser(user); setSelectedRole(user.role); setRoleDialogOpen(true); }} disabled={user.role === 'owner'}>
                                <IconEdit size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove User">
                              <IconButton size="small" color="error" onClick={() => handleRemoveUser(user.id)} disabled={user.role === 'owner'}>
                                <IconTrash size={16} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>

              {/* Activity Log Tab */}
              <TabPanel value={tabValue} index={1}>
                <Tabs value={activityTab} onChange={(_, v) => setActivityTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Tab label="Recent Activity" />
                  <Tab label="Login History" />
                </Tabs>

                {activityTab === 0 ? (
                  <Stack spacing={2}>
                    {activities.map((activity) => (
                      <Paper key={activity.id} variant="outlined" sx={{ p: 2 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Box sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                              {activityIcons[activity.type] || <IconSettings size={16} />}
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>{activity.action}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                by {activity.userName || 'System'} {activity.ipAddress && `• ${activity.ipAddress}`}
                              </Typography>
                            </Box>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(activity.createdAt).toLocaleString()}
                          </Typography>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>User</TableCell>
                          <TableCell>IP Address</TableCell>
                          <TableCell>Location</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Time</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {loginHistory.map((login) => (
                          <TableRow key={login.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>{login.userName}</Typography>
                              <Typography variant="caption" color="text.secondary">{login.userEmail}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{login.ipAddress}</Typography>
                              <Typography variant="caption" color="text.secondary">{login.userAgent}</Typography>
                            </TableCell>
                            <TableCell>{login.location || 'Unknown'}</TableCell>
                            <TableCell>
                              {login.success ? (
                                <Chip icon={<IconCheck size={14} />} label="Success" size="small" color="success" />
                              ) : (
                                <Tooltip title={login.failureReason}>
                                  <Chip icon={<IconX size={14} />} label="Failed" size="small" color="error" />
                                </Tooltip>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">{new Date(login.createdAt).toLocaleString()}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </TabPanel>

              {/* Settings Tab */}
              <TabPanel value={tabValue} index={2}>
                <Grid container spacing={3}>
                  {/* Feature Toggles */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" fontWeight={600} mb={2}>Feature Toggles</Typography>
                    <Stack spacing={1}>
                      <FormControlLabel
                        control={<Switch checked={tenant.settings?.customBranding || false} onChange={(e) => handleToggleSetting('customBranding', e.target.checked)} disabled={actionLoading} />}
                        label="Custom Branding"
                      />
                      <FormControlLabel
                        control={<Switch checked={tenant.settings?.analytics || false} onChange={(e) => handleToggleSetting('analytics', e.target.checked)} disabled={actionLoading} />}
                        label="Analytics"
                      />
                      <FormControlLabel
                        control={<Switch checked={tenant.settings?.apiAccess || false} onChange={(e) => handleToggleSetting('apiAccess', e.target.checked)} disabled={actionLoading} />}
                        label="API Access"
                      />
                      <FormControlLabel
                        control={<Switch checked={tenant.settings?.whiteLabel || false} onChange={(e) => handleToggleSetting('whiteLabel', e.target.checked)} disabled={actionLoading} />}
                        label="White Label"
                      />
                      <FormControlLabel
                        control={<Switch checked={tenant.settings?.ssoEnabled || false} onChange={(e) => handleToggleSetting('ssoEnabled', e.target.checked)} disabled={actionLoading} />}
                        label="SSO Enabled"
                      />
                      <FormControlLabel
                        control={<Switch checked={tenant.settings?.webhooksEnabled || false} onChange={(e) => handleToggleSetting('webhooksEnabled', e.target.checked)} disabled={actionLoading} />}
                        label="Webhooks"
                      />
                    </Stack>
                  </Grid>

                  {/* API Keys */}
                  <Grid item xs={12} md={6}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                      <Typography variant="subtitle1" fontWeight={600}>API Keys</Typography>
                      <Button size="small" startIcon={<IconPlus size={16} />} onClick={() => setApiKeyDialogOpen(true)} disabled={!tenant.settings?.apiAccess}>
                        New Key
                      </Button>
                    </Stack>
                    {!tenant.settings?.apiAccess ? (
                      <Alert severity="info" icon={<IconAlertCircle size={18} />}>
                        Enable API Access to manage API keys
                      </Alert>
                    ) : (
                      <Stack spacing={2}>
                        {apiKeys.map((key) => (
                          <Paper key={key.id} variant="outlined" sx={{ p: 2 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              <Box>
                                <Typography variant="body2" fontWeight={500}>{key.name}</Typography>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{key.key}</Typography>
                                  <IconButton size="small" onClick={() => copyToClipboard(key.key)}><IconCopy size={14} /></IconButton>
                                </Stack>
                                <Typography variant="caption" color="text.secondary">
                                  Last used: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                                </Typography>
                              </Box>
                              <IconButton size="small" color="error" onClick={() => handleRevokeApiKey(key.id)}>
                                <IconTrash size={16} />
                              </IconButton>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Grid>

                  {/* Limits */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight={600} mb={2}>Plan Limits</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Max Users</Typography>
                        <Typography variant="h6" fontWeight={500}>{tenant.settings?.maxUsers || 'Unlimited'}</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Max Podcasts</Typography>
                        <Typography variant="h6" fontWeight={500}>{tenant.settings?.maxPodcasts || 'Unlimited'}</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Max Storage</Typography>
                        <Typography variant="h6" fontWeight={500}>{tenant.settings?.maxStorageGB || 'Unlimited'} GB</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Max Bandwidth</Typography>
                        <Typography variant="h6" fontWeight={500}>{tenant.settings?.maxBandwidthGB || 'Unlimited'} GB</Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Tenant</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <ImageUpload label="Logo" prefix="tenant-logos" aspectRatio="1:1" previewWidth={100} currentImageUrl={editForm.logo} onUploadComplete={(r) => setEditForm({ ...editForm, logo: r.url })} onRemove={() => setEditForm({ ...editForm, logo: undefined })} />
            <TextField fullWidth label="Name" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            <TextField fullWidth label="Domain" value={editForm.domain || ''} onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })} />
            <TextField fullWidth label="Admin Email" value={editForm.adminEmail || ''} onChange={(e) => setEditForm({ ...editForm, adminEmail: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate} disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Save Changes'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Tenant</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>This action cannot be undone!</Alert>
          <Typography>Are you sure you want to delete <strong>{tenant.name}</strong>? All data will be permanently removed.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={actionLoading}>{actionLoading ? 'Deleting...' : 'Delete'}</Button>
        </DialogActions>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog open={planDialogOpen} onClose={() => setPlanDialogOpen(false)}>
        <DialogTitle>Change Plan</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Select Plan</InputLabel>
            <Select label="Select Plan" value={tenant.plan} onChange={(e) => handleChangePlan(e.target.value as TenantPlan)}>
              <MenuItem value="free">Free - 1GB storage, 5 users</MenuItem>
              <MenuItem value="pro">Pro - 10GB storage, 25 users</MenuItem>
              <MenuItem value="enterprise">Enterprise - 100GB storage, unlimited users</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlanDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Extend Trial Dialog */}
      <Dialog open={extendTrialDialogOpen} onClose={() => setExtendTrialDialogOpen(false)}>
        <DialogTitle>Extend Trial</DialogTitle>
        <DialogContent>
          <TextField fullWidth type="number" label="Days to extend" value={trialDays} onChange={(e) => setTrialDays(parseInt(e.target.value) || 7)} sx={{ mt: 1 }} inputProps={{ min: 1, max: 90 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExtendTrialDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleExtendTrial} disabled={actionLoading}>{actionLoading ? 'Extending...' : 'Extend'}</Button>
        </DialogActions>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)}>
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={2}>Change role for <strong>{selectedUser?.name}</strong></Typography>
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as TenantUser['role'])}>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="editor">Editor</MenuItem>
              <MenuItem value="viewer">Viewer</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleChangeRole} disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* Create API Key Dialog */}
      <Dialog open={apiKeyDialogOpen} onClose={() => setApiKeyDialogOpen(false)}>
        <DialogTitle>Create API Key</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Key Name" placeholder="e.g., Production API" value={newApiKeyName} onChange={(e) => setNewApiKeyName(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApiKeyDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateApiKey} disabled={actionLoading || !newApiKeyName}>{actionLoading ? 'Creating...' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* New API Key Created Dialog */}
      <Dialog open={newApiKeyDialog.open} onClose={() => setNewApiKeyDialog({ open: false })}>
        <DialogTitle>API Key Created</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>Make sure to copy your API key now. You won't be able to see it again!</Alert>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{newApiKeyDialog.key}</Typography>
              <IconButton onClick={() => copyToClipboard(newApiKeyDialog.key || '')}><IconCopy size={18} /></IconButton>
            </Stack>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setNewApiKeyDialog({ open: false })}>Done</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TenantDetailPage;
