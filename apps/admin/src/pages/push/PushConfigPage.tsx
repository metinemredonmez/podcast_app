import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Chip,
  Tab,
  Tabs,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  IconBell,
  IconBrandFirebase,
  IconBrandApple,
  IconBrandAndroid,
  IconWorld,
  IconKey,
  IconRefresh,
  IconTestPipe,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { apiClient } from '../../api/client';
import { logger } from '../../utils/logger';

interface PushConfig {
  id: string;
  provider: 'ONESIGNAL' | 'FIREBASE';
  isEnabled: boolean;
  oneSignalAppId?: string | null;
  hasOneSignalApiKey: boolean;
  firebaseProjectId?: string | null;
  hasFirebaseCredentials: boolean;
  defaultTitle?: string | null;
  defaultIcon?: string | null;
  defaultBadge?: string | null;
  rateLimitPerMinute: number;
  createdAt: string;
  updatedAt: string;
}

interface PushStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  last24Hours: { sent: number; delivered: number; failed: number };
  last7Days: { sent: number; delivered: number; failed: number };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const PushConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<PushConfig | null>(null);
  const [stats, setStats] = useState<PushStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Form state
  const [provider, setProvider] = useState<'ONESIGNAL' | 'FIREBASE'>('ONESIGNAL');
  const [isEnabled, setIsEnabled] = useState(false);
  const [oneSignalAppId, setOneSignalAppId] = useState('');
  const [oneSignalApiKey, setOneSignalApiKey] = useState('');
  const [firebaseProjectId, setFirebaseProjectId] = useState('');
  const [firebaseCredentials, setFirebaseCredentials] = useState('');
  const [vapidPublicKey, setVapidPublicKey] = useState('');
  const [vapidPrivateKey, setVapidPrivateKey] = useState('');
  const [vapidSubject, setVapidSubject] = useState('');
  const [defaultTitle, setDefaultTitle] = useState('');
  const [defaultIcon, setDefaultIcon] = useState('');
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState(1000);

  // UI state
  const [showApiKey, setShowApiKey] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [showVapidPrivate, setShowVapidPrivate] = useState(false);
  const [vapidDialogOpen, setVapidDialogOpen] = useState(false);
  const [generatedVapid, setGeneratedVapid] = useState<{ publicKey: string; privateKey: string } | null>(null);

  useEffect(() => {
    fetchConfig();
    fetchStats();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<PushConfig>('/push/config');
      const data = response.data;
      setConfig(data);

      if (data) {
        setProvider(data.provider);
        setIsEnabled(data.isEnabled);
        setOneSignalAppId(data.oneSignalAppId || '');
        setFirebaseProjectId(data.firebaseProjectId || '');
        setDefaultTitle(data.defaultTitle || '');
        setDefaultIcon(data.defaultIcon || '');
        setRateLimitPerMinute(data.rateLimitPerMinute);
      }
    } catch (err) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status !== 404) {
        setError('Failed to load push configuration');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get<PushStats>('/push/stats');
      setStats(response.data);
    } catch (err) {
      logger.error('Failed to load stats:', err);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload: Record<string, unknown> = {
        provider,
        isEnabled,
        defaultTitle: defaultTitle || undefined,
        defaultIcon: defaultIcon || undefined,
        rateLimitPerMinute,
      };

      if (provider === 'ONESIGNAL') {
        if (oneSignalAppId) payload.oneSignalAppId = oneSignalAppId;
        if (oneSignalApiKey) payload.oneSignalApiKey = oneSignalApiKey;
      } else if (provider === 'FIREBASE') {
        if (firebaseProjectId) payload.firebaseProjectId = firebaseProjectId;
        if (firebaseCredentials) payload.firebaseCredentials = firebaseCredentials;
      }

      // Web Push VAPID
      if (vapidPublicKey) payload.vapidPublicKey = vapidPublicKey;
      if (vapidPrivateKey) payload.vapidPrivateKey = vapidPrivateKey;
      if (vapidSubject) payload.vapidSubject = vapidSubject;

      await apiClient.patch('/push/config', payload);

      setSuccess('Configuration saved successfully');
      fetchConfig();

      // Clear sensitive fields after save
      setOneSignalApiKey('');
      setFirebaseCredentials('');
      setVapidPrivateKey('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save configuration';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestPush = async () => {
    try {
      setTesting(true);
      setError(null);

      const response = await apiClient.post<{ success: boolean; message: string }>('/push/config/test', {
        deviceToken: 'test',
      });

      if (response.data.success) {
        setSuccess(response.data.message);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Test failed';
      setError(message);
    } finally {
      setTesting(false);
    }
  };

  const handleGenerateVapidKeys = async () => {
    try {
      const response = await apiClient.post<{ publicKey: string; privateKey: string }>(
        '/push/config/generate-vapid-keys'
      );
      setGeneratedVapid(response.data);
      setVapidDialogOpen(true);
    } catch {
      setError('Failed to generate VAPID keys');
    }
  };

  const handleUseGeneratedVapid = () => {
    if (generatedVapid) {
      setVapidPublicKey(generatedVapid.publicKey);
      setVapidPrivateKey(generatedVapid.privateKey);
      setVapidDialogOpen(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Push Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure push notification providers and settings
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<IconTestPipe size={18} />}
            onClick={handleTestPush}
            disabled={!isEnabled || testing}
          >
            {testing ? 'Testing...' : 'Test Push'}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Stack>
      </Stack>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Total Sent
                </Typography>
                <Typography variant="h4" fontWeight={600}>
                  {stats.totalSent.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Delivered
                </Typography>
                <Typography variant="h4" fontWeight={600} color="success.main">
                  {stats.totalDelivered.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Failed
                </Typography>
                <Typography variant="h4" fontWeight={600} color="error.main">
                  {stats.totalFailed.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Delivery Rate
                </Typography>
                <Typography variant="h4" fontWeight={600}>
                  {stats.deliveryRate}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={stats.deliveryRate}
                  sx={{ mt: 1 }}
                  color={stats.deliveryRate > 90 ? 'success' : stats.deliveryRate > 70 ? 'warning' : 'error'}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Main Config */}
      <Card>
        <CardContent>
          {/* Enable/Disable */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Push Notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enable or disable push notifications for this tenant
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  color="primary"
                />
              }
              label={isEnabled ? 'Enabled' : 'Disabled'}
            />
          </Stack>

          {isEnabled && (
            <>
              <Divider sx={{ my: 3 }} />

              {/* Tabs */}
              <Tabs
                value={tabValue}
                onChange={(_, v) => setTabValue(v)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
              >
                <Tab icon={<IconBell size={18} />} iconPosition="start" label="Provider" />
                <Tab icon={<IconWorld size={18} />} iconPosition="start" label="Web Push" />
                <Tab icon={<IconKey size={18} />} iconPosition="start" label="Ayarlar" />
              </Tabs>

              {/* Provider Tab */}
              <TabPanel value={tabValue} index={0}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Push Provider</InputLabel>
                  <Select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as 'ONESIGNAL' | 'FIREBASE')}
                    label="Push Provider"
                  >
                    <MenuItem value="ONESIGNAL">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <IconBell size={18} />
                        <span>OneSignal</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="FIREBASE">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <IconBrandFirebase size={18} />
                        <span>Firebase Cloud Messaging (FCM)</span>
                      </Stack>
                    </MenuItem>
                  </Select>
                </FormControl>

                {provider === 'ONESIGNAL' && (
                  <Stack spacing={3}>
                    <Alert severity="info">
                      Get your OneSignal credentials from{' '}
                      <a href="https://onesignal.com" target="_blank" rel="noopener noreferrer">
                        onesignal.com
                      </a>{' '}
                      → App Settings → Keys & IDs
                    </Alert>

                    <TextField
                      label="OneSignal App ID"
                      value={oneSignalAppId}
                      onChange={(e) => setOneSignalAppId(e.target.value)}
                      fullWidth
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      InputProps={{
                        endAdornment: config?.oneSignalAppId && (
                          <Chip label="Configured" size="small" color="success" />
                        ),
                      }}
                    />

                    <TextField
                      label="OneSignal REST API Key"
                      value={oneSignalApiKey}
                      onChange={(e) => setOneSignalApiKey(e.target.value)}
                      fullWidth
                      type={showApiKey ? 'text' : 'password'}
                      placeholder={config?.hasOneSignalApiKey ? '••••••••••••••••' : 'Enter API key'}
                      InputProps={{
                        endAdornment: (
                          <Stack direction="row" spacing={1}>
                            {config?.hasOneSignalApiKey && (
                              <Chip label="Configured" size="small" color="success" />
                            )}
                            <IconButton size="small" onClick={() => setShowApiKey(!showApiKey)}>
                              {showApiKey ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                            </IconButton>
                          </Stack>
                        ),
                      }}
                    />
                  </Stack>
                )}

                {provider === 'FIREBASE' && (
                  <Stack spacing={3}>
                    <Alert severity="info">
                      Get your Firebase credentials from{' '}
                      <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">
                        Firebase Console
                      </a>{' '}
                      → Project Settings → Service Accounts → Generate new private key
                    </Alert>

                    <TextField
                      label="Firebase Project ID"
                      value={firebaseProjectId}
                      onChange={(e) => setFirebaseProjectId(e.target.value)}
                      fullWidth
                      placeholder="my-project-id"
                      InputProps={{
                        endAdornment: config?.firebaseProjectId && (
                          <Chip label="Configured" size="small" color="success" />
                        ),
                      }}
                    />

                    <TextField
                      label="Firebase Service Account JSON"
                      value={firebaseCredentials}
                      onChange={(e) => setFirebaseCredentials(e.target.value)}
                      fullWidth
                      multiline
                      rows={6}
                      type={showCredentials ? 'text' : 'password'}
                      placeholder={
                        config?.hasFirebaseCredentials
                          ? 'Credentials configured (paste new JSON to replace)'
                          : 'Paste your service account JSON here'
                      }
                      InputProps={{
                        endAdornment: (
                          <Stack direction="row" spacing={1}>
                            {config?.hasFirebaseCredentials && (
                              <Chip label="Configured" size="small" color="success" />
                            )}
                            <IconButton size="small" onClick={() => setShowCredentials(!showCredentials)}>
                              {showCredentials ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                            </IconButton>
                          </Stack>
                        ),
                      }}
                    />
                  </Stack>
                )}

                <Box mt={3}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Supported Platforms
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      icon={<IconBrandApple size={16} />}
                      label="iOS"
                      variant="outlined"
                      color="primary"
                    />
                    <Chip
                      icon={<IconBrandAndroid size={16} />}
                      label="Android"
                      variant="outlined"
                      color="success"
                    />
                    <Chip
                      icon={<IconWorld size={16} />}
                      label="Web"
                      variant="outlined"
                      color="info"
                    />
                  </Stack>
                </Box>
              </TabPanel>

              {/* Web Push Tab */}
              <TabPanel value={tabValue} index={1}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  VAPID (Voluntary Application Server Identification) keys are required for Web Push
                  notifications. Generate new keys or enter existing ones.
                </Alert>

                <Stack direction="row" spacing={2} mb={3}>
                  <Button
                    variant="outlined"
                    startIcon={<IconRefresh size={18} />}
                    onClick={handleGenerateVapidKeys}
                  >
                    Generate VAPID Keys
                  </Button>
                </Stack>

                <Stack spacing={3}>
                  <TextField
                    label="VAPID Public Key"
                    value={vapidPublicKey}
                    onChange={(e) => setVapidPublicKey(e.target.value)}
                    fullWidth
                    placeholder="BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    helperText="This key will be used by web clients to subscribe to push notifications"
                    InputProps={{
                      endAdornment: vapidPublicKey && (
                        <IconButton size="small" onClick={() => copyToClipboard(vapidPublicKey)}>
                          <IconCopy size={18} />
                        </IconButton>
                      ),
                    }}
                  />

                  <TextField
                    label="VAPID Private Key"
                    value={vapidPrivateKey}
                    onChange={(e) => setVapidPrivateKey(e.target.value)}
                    fullWidth
                    type={showVapidPrivate ? 'text' : 'password'}
                    placeholder="Enter VAPID private key"
                    helperText="Keep this key secret - it's used to sign push messages"
                    InputProps={{
                      endAdornment: (
                        <IconButton size="small" onClick={() => setShowVapidPrivate(!showVapidPrivate)}>
                          {showVapidPrivate ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                        </IconButton>
                      ),
                    }}
                  />

                  <TextField
                    label="VAPID Subject"
                    value={vapidSubject}
                    onChange={(e) => setVapidSubject(e.target.value)}
                    fullWidth
                    placeholder="mailto:admin@example.com"
                    helperText="A mailto: or https: URL for contact in case of issues"
                  />
                </Stack>

                <Paper variant="outlined" sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Frontend Integration
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Add this code to your web app to enable push notifications:
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      p: 2,
                      bgcolor: 'grey.900',
                      color: 'grey.100',
                      borderRadius: 1,
                      overflow: 'auto',
                      fontSize: '0.75rem',
                    }}
                  >
                    {`// Request notification permission
const permission = await Notification.requestPermission();
if (permission === 'granted') {
  // Get VAPID public key from API
  const { publicKey } = await fetch('/api/push/vapid-public-key')
    .then(r => r.json());

  // Subscribe to push
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: publicKey
  });

  // Send subscription to backend
  await fetch('/api/push/devices', {
    method: 'POST',
    body: JSON.stringify({
      deviceToken: JSON.stringify(subscription),
      platform: 'WEB'
    })
  });
}`}
                  </Box>
                </Paper>
              </TabPanel>

              {/* Settings Tab */}
              <TabPanel value={tabValue} index={2}>
                <Stack spacing={3}>
                  <TextField
                    label="Default Notification Title"
                    value={defaultTitle}
                    onChange={(e) => setDefaultTitle(e.target.value)}
                    fullWidth
                    placeholder="My App"
                    helperText="Used when no title is specified"
                  />

                  <TextField
                    label="Default Notification Icon URL"
                    value={defaultIcon}
                    onChange={(e) => setDefaultIcon(e.target.value)}
                    fullWidth
                    placeholder="https://example.com/icon.png"
                    helperText="URL to the default notification icon"
                  />

                  <TextField
                    label="Rate Limit (per minute)"
                    type="number"
                    value={rateLimitPerMinute}
                    onChange={(e) => setRateLimitPerMinute(parseInt(e.target.value, 10) || 1000)}
                    fullWidth
                    inputProps={{ min: 10, max: 10000 }}
                    helperText="Maximum number of push notifications per minute"
                  />
                </Stack>
              </TabPanel>
            </>
          )}
        </CardContent>
      </Card>

      {/* VAPID Keys Dialog */}
      <Dialog open={vapidDialogOpen} onClose={() => setVapidDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generated VAPID Keys</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Save these keys securely! The private key will only be shown once.
          </Alert>

          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Public Key
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {generatedVapid?.publicKey}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => generatedVapid && copyToClipboard(generatedVapid.publicKey)}
                  >
                    <IconCopy size={18} />
                  </IconButton>
                </Stack>
              </Paper>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Private Key
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {generatedVapid?.privateKey}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => generatedVapid && copyToClipboard(generatedVapid.privateKey)}
                  >
                    <IconCopy size={18} />
                  </IconButton>
                </Stack>
              </Paper>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVapidDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUseGeneratedVapid}>
            Use These Keys
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PushConfigPage;
