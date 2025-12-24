import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Chip,
  Grid,
  Tab,
  Tabs,
  IconButton,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  IconBrandGoogle,
  IconPhone,
  IconBell,
  IconMail,
  IconCloud,
  IconSettings,
  IconTestPipe,
  IconEye,
  IconEyeOff,
  IconCheck,
  IconCopy,
  IconBrandFirebase,
  IconRefresh,
} from '@tabler/icons-react';
import { apiClient } from '../../api/client';

// ==================== INTERFACES ====================

interface SocialAuthConfig {
  googleEnabled: boolean;
  googleClientId: string | null;
  googleConfigured: boolean;
  googleCallbackUrl: string | null;
  appleEnabled: boolean;
  appleConfigured: boolean;
}

interface SmsConfig {
  isEnabled: boolean;
  provider: string;
  netgsmUsercode: string | null;
  hasNetgsmPassword: boolean;
  netgsmMsgHeader: string | null;
  otpLength: number;
  otpExpiryMins: number;
}

interface PushConfig {
  provider: 'ONESIGNAL' | 'FIREBASE';
  isEnabled: boolean;
  oneSignalAppId?: string | null;
  hasOneSignalApiKey: boolean;
  firebaseProjectId?: string | null;
  hasFirebaseCredentials: boolean;
}

interface EmailConfig {
  isEnabled: boolean;
  provider: 'SMTP' | 'SES' | 'SENDGRID';
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  hasSmtpPassword: boolean;
  smtpSecure?: boolean;
  fromEmail?: string | null;
  fromName?: string | null;
}

interface StorageConfig {
  provider: 'LOCAL' | 'S3' | 'MINIO';
  isEnabled: boolean;
  s3Bucket?: string | null;
  s3Region?: string | null;
  hasS3Credentials: boolean;
  minioEndpoint?: string | null;
  minioBucket?: string | null;
  hasMinioCredentials: boolean;
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

// ==================== MAIN COMPONENT ====================

const SystemSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Config states
  const [socialAuthConfig, setSocialAuthConfig] = useState<SocialAuthConfig | null>(null);
  const [smsConfig, setSmsConfig] = useState<SmsConfig | null>(null);
  const [pushConfig, setPushConfig] = useState<PushConfig | null>(null);
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);
  const [storageConfig, setStorageConfig] = useState<StorageConfig | null>(null);

  // Google OAuth form
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);

  // SMS form
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [netgsmUsercode, setNetgsmUsercode] = useState('');
  const [netgsmPassword, setNetgsmPassword] = useState('');
  const [netgsmMsgHeader, setNetgsmMsgHeader] = useState('');
  const [showSmsPassword, setShowSmsPassword] = useState(false);

  // Push form
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushProvider, setPushProvider] = useState<'ONESIGNAL' | 'FIREBASE'>('ONESIGNAL');
  const [oneSignalAppId, setOneSignalAppId] = useState('');
  const [oneSignalApiKey, setOneSignalApiKey] = useState('');
  const [firebaseProjectId, setFirebaseProjectId] = useState('');
  const [firebaseCredentials, setFirebaseCredentials] = useState('');
  const [showPushSecret, setShowPushSecret] = useState(false);

  // Email form
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailProvider, setEmailProvider] = useState<'SMTP' | 'SES' | 'SENDGRID'>('SMTP');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  // Storage form
  const [storageProvider, setStorageProvider] = useState<'LOCAL' | 'S3' | 'MINIO'>('LOCAL');
  const [s3Bucket, setS3Bucket] = useState('');
  const [s3Region, setS3Region] = useState('');
  const [s3AccessKey, setS3AccessKey] = useState('');
  const [s3SecretKey, setS3SecretKey] = useState('');
  const [minioEndpoint, setMinioEndpoint] = useState('');
  const [minioBucket, setMinioBucket] = useState('');
  const [minioAccessKey, setMinioAccessKey] = useState('');
  const [minioSecretKey, setMinioSecretKey] = useState('');
  const [showStorageSecret, setShowStorageSecret] = useState(false);

  useEffect(() => {
    fetchAllConfigs();
  }, []);

  const fetchAllConfigs = async () => {
    setLoading(true);
    try {
      const [socialRes, smsRes, pushRes, storageRes, emailRes] = await Promise.allSettled([
        apiClient.get<SocialAuthConfig>('/admin/social-auth/config'),
        apiClient.get<SmsConfig>('/admin/sms/config'),
        apiClient.get<PushConfig>('/push/config'),
        apiClient.get<StorageConfig>('/admin/storage/config'),
        apiClient.get<EmailConfig>('/admin/email/config'),
      ]);

      if (socialRes.status === 'fulfilled') {
        const data = socialRes.value.data;
        setSocialAuthConfig(data);
        setGoogleEnabled(data.googleEnabled);
        setGoogleClientId(data.googleClientId || '');
      }

      if (smsRes.status === 'fulfilled') {
        const data = smsRes.value.data;
        setSmsConfig(data);
        setSmsEnabled(data.isEnabled);
        setNetgsmUsercode(data.netgsmUsercode || '');
        setNetgsmMsgHeader(data.netgsmMsgHeader || '');
      }

      if (pushRes.status === 'fulfilled') {
        const data = pushRes.value.data;
        setPushConfig(data);
        setPushEnabled(data.isEnabled);
        setPushProvider(data.provider);
        setOneSignalAppId(data.oneSignalAppId || '');
        setFirebaseProjectId(data.firebaseProjectId || '');
      }

      if (storageRes.status === 'fulfilled') {
        const data = storageRes.value.data;
        setStorageConfig(data);
        setStorageProvider(data.provider || 'LOCAL');
        setS3Bucket(data.s3Bucket || '');
        setS3Region(data.s3Region || '');
        setMinioEndpoint(data.minioEndpoint || '');
        setMinioBucket(data.minioBucket || '');
      }

      if (emailRes.status === 'fulfilled') {
        const data = emailRes.value.data;
        setEmailConfig(data);
        setEmailEnabled(data.isEnabled);
        setEmailProvider(data.provider);
        setSmtpHost(data.smtpHost || '');
        setSmtpPort(String(data.smtpPort || 587));
        setSmtpUser(data.smtpUser || '');
        setFromEmail(data.fromEmail || '');
        setFromName(data.fromName || '');
      }
    } catch (err) {
      console.error('Failed to fetch configs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoogle = async () => {
    try {
      setSaving(true);
      setError(null);
      const payload: Record<string, unknown> = { googleEnabled };
      if (googleClientId) payload.googleClientId = googleClientId;
      if (googleClientSecret) payload.googleClientSecret = googleClientSecret;

      await apiClient.put('/admin/social-auth/config', payload);
      setSuccess('Google OAuth ayarları kaydedildi');
      setGoogleClientSecret('');
      fetchAllConfigs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kaydetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSms = async () => {
    try {
      setSaving(true);
      setError(null);
      const payload: Record<string, unknown> = { isEnabled: smsEnabled };
      if (netgsmUsercode) payload.netgsmUsercode = netgsmUsercode;
      if (netgsmPassword) payload.netgsmPassword = netgsmPassword;
      if (netgsmMsgHeader) payload.netgsmMsgHeader = netgsmMsgHeader;

      await apiClient.put('/admin/sms/config', payload);
      setSuccess('SMS ayarları kaydedildi');
      setNetgsmPassword('');
      fetchAllConfigs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kaydetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePush = async () => {
    try {
      setSaving(true);
      setError(null);
      const payload: Record<string, unknown> = {
        isEnabled: pushEnabled,
        provider: pushProvider,
      };

      // Always send OneSignal fields if they have values
      if (oneSignalAppId) payload.oneSignalAppId = oneSignalAppId;
      if (oneSignalApiKey) payload.oneSignalApiKey = oneSignalApiKey;

      // Always send Firebase fields if they have values
      if (firebaseProjectId) payload.firebaseProjectId = firebaseProjectId;
      if (firebaseCredentials) payload.firebaseCredentials = firebaseCredentials;

      await apiClient.patch('/push/config', payload);
      setSuccess('Push ayarları kaydedildi');
      setOneSignalApiKey('');
      setFirebaseCredentials('');
      fetchAllConfigs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kaydetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStorage = async () => {
    try {
      setSaving(true);
      setError(null);
      const payload: Record<string, unknown> = {
        provider: storageProvider,
      };

      if (storageProvider === 'S3') {
        if (s3Bucket) payload.s3Bucket = s3Bucket;
        if (s3Region) payload.s3Region = s3Region;
        if (s3AccessKey) payload.s3AccessKey = s3AccessKey;
        if (s3SecretKey) payload.s3SecretKey = s3SecretKey;
      } else if (storageProvider === 'MINIO') {
        if (minioEndpoint) payload.minioEndpoint = minioEndpoint;
        if (minioBucket) payload.minioBucket = minioBucket;
        if (minioAccessKey) payload.minioAccessKey = minioAccessKey;
        if (minioSecretKey) payload.minioSecretKey = minioSecretKey;
      }

      await apiClient.put('/admin/storage/config', payload);
      setSuccess('Storage ayarları kaydedildi');
      setS3SecretKey('');
      setMinioSecretKey('');
      fetchAllConfigs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kaydetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    try {
      setSaving(true);
      setError(null);
      const payload: Record<string, unknown> = {
        isEnabled: emailEnabled,
        provider: emailProvider,
      };

      if (emailProvider === 'SMTP') {
        if (smtpHost) payload.smtpHost = smtpHost;
        if (smtpPort) payload.smtpPort = parseInt(smtpPort, 10);
        if (smtpUser) payload.smtpUser = smtpUser;
        if (smtpPassword) payload.smtpPassword = smtpPassword;
      }

      if (fromEmail) payload.fromEmail = fromEmail;
      if (fromName) payload.fromName = fromName;

      await apiClient.put('/admin/email/config', payload);
      setSuccess('Email ayarları kaydedildi');
      setSmtpPassword('');
      fetchAllConfigs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kaydetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Panoya kopyalandı');
  };

  const getDefaultCallbackUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3300';
    return `${apiUrl}/api/auth/google/callback`;
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
            Sistem Ayarları
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tüm entegrasyonları ve kimlik bilgilerini tek bir yerden yönetin
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<IconRefresh size={18} />}
          onClick={fetchAllConfigs}
        >
          Yenile
        </Button>
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

      {/* Status Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <IconBrandGoogle size={24} color={socialAuthConfig?.googleConfigured ? '#4caf50' : '#9e9e9e'} />
              <Typography variant="body2" sx={{ mt: 1 }}>Google OAuth</Typography>
              <Chip
                label={socialAuthConfig?.googleConfigured ? 'Aktif' : 'Yapılandırılmadı'}
                size="small"
                color={socialAuthConfig?.googleConfigured ? 'success' : 'default'}
                sx={{ mt: 0.5 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <IconPhone size={24} color={smsConfig?.hasNetgsmPassword ? '#4caf50' : '#9e9e9e'} />
              <Typography variant="body2" sx={{ mt: 1 }}>SMS (NetGSM)</Typography>
              <Chip
                label={smsConfig?.hasNetgsmPassword ? 'Aktif' : 'Yapılandırılmadı'}
                size="small"
                color={smsConfig?.hasNetgsmPassword ? 'success' : 'default'}
                sx={{ mt: 0.5 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <IconBell size={24} color={pushConfig?.isEnabled ? '#4caf50' : '#9e9e9e'} />
              <Typography variant="body2" sx={{ mt: 1 }}>Push Notifications</Typography>
              <Chip
                label={pushConfig?.isEnabled ? 'Aktif' : 'Yapılandırılmadı'}
                size="small"
                color={pushConfig?.isEnabled ? 'success' : 'default'}
                sx={{ mt: 0.5 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <IconCloud size={24} color={storageConfig?.provider !== 'LOCAL' ? '#4caf50' : '#9e9e9e'} />
              <Typography variant="body2" sx={{ mt: 1 }}>Storage</Typography>
              <Chip
                label={storageConfig?.provider === 'LOCAL' ? 'Yerel' : storageConfig?.provider || 'Yapılandırılmadı'}
                size="small"
                color={storageConfig?.provider ? 'success' : 'default'}
                sx={{ mt: 0.5 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Config Card */}
      <Card>
        <CardContent>
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab icon={<IconBrandGoogle size={18} />} iconPosition="start" label="OAuth" />
            <Tab icon={<IconPhone size={18} />} iconPosition="start" label="SMS" />
            <Tab icon={<IconBell size={18} />} iconPosition="start" label="Push" />
            <Tab icon={<IconMail size={18} />} iconPosition="start" label="Email" />
            <Tab icon={<IconCloud size={18} />} iconPosition="start" label="Storage" />
          </Tabs>

          {/* Google OAuth Tab */}
          <TabPanel value={tabValue} index={0}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: googleEnabled ? 'error.lighter' : 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconBrandGoogle size={28} color={googleEnabled ? '#DB4437' : '#9e9e9e'} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={600}>Google OAuth</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Google ile giriş yapma özelliği
                  </Typography>
                </Box>
              </Stack>
              <FormControlLabel
                control={
                  <Switch
                    checked={googleEnabled}
                    onChange={(e) => setGoogleEnabled(e.target.checked)}
                  />
                }
                label={googleEnabled ? 'Aktif' : 'Pasif'}
              />
            </Stack>

            <Alert severity="info" sx={{ mb: 3 }}>
              <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer">
                Google Cloud Console
              </a>
              {' '}→ APIs & Services → Credentials → Create Credentials → OAuth client ID
            </Alert>

            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>Callback URL</Typography>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {getDefaultCallbackUrl()}
                    </Typography>
                    <IconButton size="small" onClick={() => copyToClipboard(getDefaultCallbackUrl())}>
                      <IconCopy size={18} />
                    </IconButton>
                  </Stack>
                </Paper>
              </Box>

              <TextField
                label="Google Client ID"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                fullWidth
                placeholder="xxxxxxxxxxxxx.apps.googleusercontent.com"
                InputProps={{
                  endAdornment: socialAuthConfig?.googleClientId && (
                    <Chip label="Yapılandırıldı" size="small" color="success" />
                  ),
                }}
              />

              <TextField
                label="Google Client Secret"
                value={googleClientSecret}
                onChange={(e) => setGoogleClientSecret(e.target.value)}
                fullWidth
                type={showGoogleSecret ? 'text' : 'password'}
                placeholder={socialAuthConfig?.googleConfigured ? '••••••••' : 'GOCSPX-xxx'}
                InputProps={{
                  endAdornment: (
                    <Stack direction="row" spacing={1}>
                      {socialAuthConfig?.googleConfigured && (
                        <Chip label="Yapılandırıldı" size="small" color="success" />
                      )}
                      <IconButton size="small" onClick={() => setShowGoogleSecret(!showGoogleSecret)}>
                        {showGoogleSecret ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                      </IconButton>
                    </Stack>
                  ),
                }}
              />

              <Button variant="contained" onClick={handleSaveGoogle} disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Google Ayarlarını Kaydet'}
              </Button>
            </Stack>
          </TabPanel>

          {/* SMS Tab */}
          <TabPanel value={tabValue} index={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: smsEnabled ? 'primary.lighter' : 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconPhone size={28} color={smsEnabled ? '#1976d2' : '#9e9e9e'} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={600}>NetGSM SMS</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Telefon ile OTP giriş
                  </Typography>
                </Box>
              </Stack>
              <FormControlLabel
                control={
                  <Switch
                    checked={smsEnabled}
                    onChange={(e) => setSmsEnabled(e.target.checked)}
                  />
                }
                label={smsEnabled ? 'Aktif' : 'Pasif'}
              />
            </Stack>

            <Alert severity="info" sx={{ mb: 3 }}>
              <a href="https://www.netgsm.com.tr" target="_blank" rel="noopener noreferrer">
                netgsm.com.tr
              </a>
              {' '}→ Ayarlar → API Bilgileri
            </Alert>

            <Stack spacing={3}>
              <TextField
                label="Kullanıcı Kodu (Usercode)"
                value={netgsmUsercode}
                onChange={(e) => setNetgsmUsercode(e.target.value)}
                fullWidth
                placeholder="8501234567"
                InputProps={{
                  endAdornment: smsConfig?.netgsmUsercode && (
                    <Chip label="Yapılandırıldı" size="small" color="success" />
                  ),
                }}
              />

              <TextField
                label="API Şifresi"
                value={netgsmPassword}
                onChange={(e) => setNetgsmPassword(e.target.value)}
                fullWidth
                type={showSmsPassword ? 'text' : 'password'}
                placeholder={smsConfig?.hasNetgsmPassword ? '••••••••' : 'API şifresi'}
                InputProps={{
                  endAdornment: (
                    <Stack direction="row" spacing={1}>
                      {smsConfig?.hasNetgsmPassword && (
                        <Chip label="Yapılandırıldı" size="small" color="success" />
                      )}
                      <IconButton size="small" onClick={() => setShowSmsPassword(!showSmsPassword)}>
                        {showSmsPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                      </IconButton>
                    </Stack>
                  ),
                }}
              />

              <TextField
                label="Mesaj Başlığı (Sender ID)"
                value={netgsmMsgHeader}
                onChange={(e) => setNetgsmMsgHeader(e.target.value)}
                fullWidth
                placeholder="FIRMAADI"
                helperText="Max 11 karakter"
                InputProps={{
                  endAdornment: smsConfig?.netgsmMsgHeader && (
                    <Chip label="Yapılandırıldı" size="small" color="success" />
                  ),
                }}
              />

              <Button variant="contained" onClick={handleSaveSms} disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'SMS Ayarlarını Kaydet'}
              </Button>
            </Stack>
          </TabPanel>

          {/* Push Tab */}
          <TabPanel value={tabValue} index={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: pushEnabled ? 'warning.lighter' : 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconBell size={28} color={pushEnabled ? '#ed6c02' : '#9e9e9e'} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={600}>Push Notifications</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mobil ve web bildirimleri
                  </Typography>
                </Box>
              </Stack>
              <FormControlLabel
                control={
                  <Switch
                    checked={pushEnabled}
                    onChange={(e) => setPushEnabled(e.target.checked)}
                  />
                }
                label={pushEnabled ? 'Aktif' : 'Pasif'}
              />
            </Stack>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Provider</InputLabel>
              <Select
                value={pushProvider}
                onChange={(e) => setPushProvider(e.target.value as 'ONESIGNAL' | 'FIREBASE')}
                label="Provider"
              >
                <MenuItem value="ONESIGNAL">OneSignal</MenuItem>
                <MenuItem value="FIREBASE">Firebase Cloud Messaging</MenuItem>
              </Select>
            </FormControl>

            {pushProvider === 'ONESIGNAL' ? (
              <Stack spacing={3}>
                <Alert severity="info">
                  <a href="https://onesignal.com" target="_blank" rel="noopener noreferrer">
                    onesignal.com
                  </a>
                  {' '}→ App Settings → Keys & IDs
                </Alert>

                <TextField
                  label="OneSignal App ID"
                  value={oneSignalAppId}
                  onChange={(e) => setOneSignalAppId(e.target.value)}
                  fullWidth
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  InputProps={{
                    endAdornment: pushConfig?.oneSignalAppId && (
                      <Chip label="Yapılandırıldı" size="small" color="success" />
                    ),
                  }}
                />

                <TextField
                  label="REST API Key"
                  value={oneSignalApiKey}
                  onChange={(e) => setOneSignalApiKey(e.target.value)}
                  fullWidth
                  type={showPushSecret ? 'text' : 'password'}
                  placeholder={pushConfig?.hasOneSignalApiKey ? '••••••••' : 'API Key'}
                  InputProps={{
                    endAdornment: (
                      <Stack direction="row" spacing={1}>
                        {pushConfig?.hasOneSignalApiKey && (
                          <Chip label="Yapılandırıldı" size="small" color="success" />
                        )}
                        <IconButton size="small" onClick={() => setShowPushSecret(!showPushSecret)}>
                          {showPushSecret ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                        </IconButton>
                      </Stack>
                    ),
                  }}
                />
              </Stack>
            ) : (
              <Stack spacing={3}>
                <Alert severity="info">
                  <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">
                    Firebase Console
                  </a>
                  {' '}→ Project Settings → Service Accounts → Generate new private key
                </Alert>

                <TextField
                  label="Firebase Project ID"
                  value={firebaseProjectId}
                  onChange={(e) => setFirebaseProjectId(e.target.value)}
                  fullWidth
                  placeholder="my-project-id"
                  InputProps={{
                    endAdornment: pushConfig?.firebaseProjectId && (
                      <Chip label="Yapılandırıldı" size="small" color="success" />
                    ),
                  }}
                />

                <TextField
                  label="Service Account JSON"
                  value={firebaseCredentials}
                  onChange={(e) => setFirebaseCredentials(e.target.value)}
                  fullWidth
                  multiline
                  rows={4}
                  placeholder={pushConfig?.hasFirebaseCredentials ? 'Credentials configured' : 'Paste JSON here'}
                  InputProps={{
                    endAdornment: pushConfig?.hasFirebaseCredentials && (
                      <Chip label="Yapılandırıldı" size="small" color="success" />
                    ),
                  }}
                />
              </Stack>
            )}

            <Button variant="contained" onClick={handleSavePush} disabled={saving} sx={{ mt: 3 }}>
              {saving ? 'Kaydediliyor...' : 'Push Ayarlarını Kaydet'}
            </Button>
          </TabPanel>

          {/* Email Tab */}
          <TabPanel value={tabValue} index={3}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: emailEnabled ? 'info.lighter' : 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconMail size={28} color={emailEnabled ? '#0288d1' : '#9e9e9e'} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={600}>Email / SMTP</Typography>
                  <Typography variant="body2" color="text.secondary">
                    E-posta gönderimi ve bildirimleri
                  </Typography>
                </Box>
              </Stack>
              <FormControlLabel
                control={
                  <Switch
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                  />
                }
                label={emailEnabled ? 'Aktif' : 'Pasif'}
              />
            </Stack>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Provider</InputLabel>
              <Select
                value={emailProvider}
                onChange={(e) => setEmailProvider(e.target.value as 'SMTP' | 'SES' | 'SENDGRID')}
                label="Provider"
              >
                <MenuItem value="SMTP">SMTP (Custom)</MenuItem>
                <MenuItem value="SES">Amazon SES</MenuItem>
                <MenuItem value="SENDGRID">SendGrid</MenuItem>
              </Select>
            </FormControl>

            <Alert severity="info" sx={{ mb: 3 }}>
              {emailProvider === 'SMTP' && 'SMTP sunucu bilgilerinizi girin (Gmail, Outlook, custom vb.)'}
              {emailProvider === 'SES' && 'AWS SES kimlik bilgilerinizi AWS Console\'dan alın'}
              {emailProvider === 'SENDGRID' && 'SendGrid API Key\'i SendGrid Dashboard\'dan alın'}
            </Alert>

            <Stack spacing={3}>
              {emailProvider === 'SMTP' && (
                <>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                      <TextField
                        label="SMTP Host"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        fullWidth
                        placeholder="smtp.gmail.com"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Port"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                        fullWidth
                        placeholder="587"
                        type="number"
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    label="Kullanıcı Adı"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    fullWidth
                    placeholder="user@example.com"
                  />

                  <TextField
                    label="Şifre / App Password"
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    fullWidth
                    type={showEmailPassword ? 'text' : 'password'}
                    placeholder={emailConfig?.hasSmtpPassword ? '••••••••' : 'SMTP şifresi'}
                    InputProps={{
                      endAdornment: (
                        <Stack direction="row" spacing={1}>
                          {emailConfig?.hasSmtpPassword && (
                            <Chip label="Yapılandırıldı" size="small" color="success" />
                          )}
                          <IconButton size="small" onClick={() => setShowEmailPassword(!showEmailPassword)}>
                            {showEmailPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                          </IconButton>
                        </Stack>
                      ),
                    }}
                  />
                </>
              )}

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Gönderen E-posta"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    fullWidth
                    placeholder="noreply@example.com"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Gönderen Adı"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    fullWidth
                    placeholder="Podcast App"
                  />
                </Grid>
              </Grid>

              <Button variant="contained" onClick={handleSaveEmail} disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Email Ayarlarını Kaydet'}
              </Button>
            </Stack>
          </TabPanel>

          {/* Storage Tab */}
          <TabPanel value={tabValue} index={4}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: storageProvider !== 'LOCAL' ? 'success.lighter' : 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconCloud size={28} color={storageProvider !== 'LOCAL' ? '#2e7d32' : '#9e9e9e'} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={600}>Storage</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dosya ve medya depolama ayarları
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Storage Provider</InputLabel>
              <Select
                value={storageProvider}
                onChange={(e) => setStorageProvider(e.target.value as 'LOCAL' | 'S3' | 'MINIO')}
                label="Storage Provider"
              >
                <MenuItem value="LOCAL">Yerel Depolama (Local)</MenuItem>
                <MenuItem value="S3">Amazon S3</MenuItem>
                <MenuItem value="MINIO">MinIO (Self-hosted S3)</MenuItem>
              </Select>
            </FormControl>

            {storageProvider === 'LOCAL' && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Dosyalar sunucunun yerel diskinde depolanacak. Production için S3 veya MinIO önerilir.
              </Alert>
            )}

            {storageProvider === 'S3' && (
              <Stack spacing={3}>
                <Alert severity="info">
                  <a href="https://aws.amazon.com/s3" target="_blank" rel="noopener noreferrer">
                    AWS Console
                  </a>
                  {' '}→ S3 → Create Bucket → IAM → Create Access Key
                </Alert>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Bucket Adı"
                      value={s3Bucket}
                      onChange={(e) => setS3Bucket(e.target.value)}
                      fullWidth
                      placeholder="my-podcast-bucket"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Region"
                      value={s3Region}
                      onChange={(e) => setS3Region(e.target.value)}
                      fullWidth
                      placeholder="eu-central-1"
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="Access Key ID"
                  value={s3AccessKey}
                  onChange={(e) => setS3AccessKey(e.target.value)}
                  fullWidth
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                />

                <TextField
                  label="Secret Access Key"
                  value={s3SecretKey}
                  onChange={(e) => setS3SecretKey(e.target.value)}
                  fullWidth
                  type={showStorageSecret ? 'text' : 'password'}
                  placeholder={storageConfig?.hasS3Credentials ? '••••••••' : 'Secret Key'}
                  InputProps={{
                    endAdornment: (
                      <Stack direction="row" spacing={1}>
                        {storageConfig?.hasS3Credentials && (
                          <Chip label="Yapılandırıldı" size="small" color="success" />
                        )}
                        <IconButton size="small" onClick={() => setShowStorageSecret(!showStorageSecret)}>
                          {showStorageSecret ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                        </IconButton>
                      </Stack>
                    ),
                  }}
                />
              </Stack>
            )}

            {storageProvider === 'MINIO' && (
              <Stack spacing={3}>
                <Alert severity="info">
                  MinIO self-hosted S3-uyumlu object storage. Docker ile kolayca kurulabilir.
                </Alert>

                <TextField
                  label="MinIO Endpoint"
                  value={minioEndpoint}
                  onChange={(e) => setMinioEndpoint(e.target.value)}
                  fullWidth
                  placeholder="http://localhost:9000"
                />

                <TextField
                  label="Bucket Adı"
                  value={minioBucket}
                  onChange={(e) => setMinioBucket(e.target.value)}
                  fullWidth
                  placeholder="podcast-files"
                />

                <TextField
                  label="Access Key"
                  value={minioAccessKey}
                  onChange={(e) => setMinioAccessKey(e.target.value)}
                  fullWidth
                  placeholder="minioadmin"
                />

                <TextField
                  label="Secret Key"
                  value={minioSecretKey}
                  onChange={(e) => setMinioSecretKey(e.target.value)}
                  fullWidth
                  type={showStorageSecret ? 'text' : 'password'}
                  placeholder={storageConfig?.hasMinioCredentials ? '••••••••' : 'Secret Key'}
                  InputProps={{
                    endAdornment: (
                      <Stack direction="row" spacing={1}>
                        {storageConfig?.hasMinioCredentials && (
                          <Chip label="Yapılandırıldı" size="small" color="success" />
                        )}
                        <IconButton size="small" onClick={() => setShowStorageSecret(!showStorageSecret)}>
                          {showStorageSecret ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                        </IconButton>
                      </Stack>
                    ),
                  }}
                />
              </Stack>
            )}

            <Button variant="contained" onClick={handleSaveStorage} disabled={saving} sx={{ mt: 3 }}>
              {saving ? 'Kaydediliyor...' : 'Storage Ayarlarını Kaydet'}
            </Button>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Detaylı Ayarlar
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Her entegrasyon için detaylı ayarlar ve loglar
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" href="/settings/social-auth" startIcon={<IconBrandGoogle size={18} />}>
              OAuth Detayları
            </Button>
            <Button variant="outlined" href="/settings/sms" startIcon={<IconPhone size={18} />}>
              SMS Detayları
            </Button>
            <Button variant="outlined" href="/push" startIcon={<IconBell size={18} />}>
              Push Detayları
            </Button>
            <Button variant="outlined" href="/push/logs" startIcon={<IconSettings size={18} />}>
              Push Logları
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SystemSettingsPage;
