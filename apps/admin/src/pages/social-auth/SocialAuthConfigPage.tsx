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
  IconButton,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  IconBrandGoogle,
  IconTestPipe,
  IconEye,
  IconEyeOff,
  IconCheck,
  IconX,
  IconLink,
  IconCopy,
} from '@tabler/icons-react';
import { apiClient } from '../../api/client';

interface SocialAuthConfig {
  googleEnabled: boolean;
  googleClientId: string | null;
  googleConfigured: boolean;
  googleCallbackUrl: string | null;
  updatedAt: string | null;
}

interface TestResult {
  success: boolean;
  message: string;
}

const SocialAuthConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<SocialAuthConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state - Sabit değerler
  const [googleEnabled, setGoogleEnabled] = useState(true);
  const [googleClientId, setGoogleClientId] = useState('134087975400-u824lhqcgnode9ktquqo2gerof6240v6.apps.googleusercontent.com');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [googleCallbackUrl, setGoogleCallbackUrl] = useState('https://api.uzmanumre.com/api/auth/google/callback');

  // UI state
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<SocialAuthConfig>('/admin/social-auth/config');
      const data = response.data;
      setConfig(data);

      if (data) {
        setGoogleEnabled(data.googleEnabled ?? true);
        // Varsayılan Client ID - uzmanumre.com
        setGoogleClientId(data.googleClientId || '134087975400-u824lhqcgnode9ktquqo2gerof6240v6.apps.googleusercontent.com');
        setGoogleCallbackUrl(data.googleCallbackUrl || 'https://api.uzmanumre.com/api/auth/google/callback');
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError('Konfigürasyon yüklenemedi');
      }
      // Backend'den veri gelmezse varsayılanları kullan
      setGoogleEnabled(true);
      setGoogleClientId('134087975400-u824lhqcgnode9ktquqo2gerof6240v6.apps.googleusercontent.com');
      setGoogleCallbackUrl('https://api.uzmanumre.com/api/auth/google/callback');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultCallbackUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${apiUrl}/api/auth/google/callback`;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload: Record<string, unknown> = {
        googleEnabled,
      };

      if (googleClientId) payload.googleClientId = googleClientId;
      if (googleClientSecret) payload.googleClientSecret = googleClientSecret;
      if (googleCallbackUrl) payload.googleCallbackUrl = googleCallbackUrl;

      await apiClient.put('/admin/social-auth/config', payload);

      setSuccess('Konfigürasyon kaydedildi');
      fetchConfig();

      // Clear sensitive field after save
      setGoogleClientSecret('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kaydetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setError(null);

      const response = await apiClient.post<TestResult>('/admin/social-auth/google/test');

      if (response.data.success) {
        setSuccess(response.data.message);
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Test başarısız');
    } finally {
      setTesting(false);
    }
  };

  const handleDeleteConfig = async () => {
    if (!confirm('Google OAuth yapılandırmasını silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await apiClient.delete('/admin/social-auth/google');
      setSuccess('Google OAuth yapılandırması silindi');
      setGoogleEnabled(false);
      setGoogleClientId('');
      setGoogleClientSecret('');
      fetchConfig();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Silme başarısız');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Panoya kopyalandı');
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
            Sosyal Giriş Ayarları
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Google ve diğer sosyal giriş sağlayıcılarını yapılandırın
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<IconTestPipe size={18} />}
            onClick={handleTestConnection}
            disabled={!config?.googleConfigured || testing}
          >
            {testing ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
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

      {/* Google OAuth Card */}
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
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
            <Box flex={1}>
              <Typography variant="h6" fontWeight={600}>
                Google OAuth
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kullanıcıların Google hesaplarıyla giriş yapmasını sağlayın
              </Typography>
            </Box>
            <Stack direction="row" alignItems="center" spacing={2}>
              {config?.googleConfigured && (
                <Chip
                  icon={<IconCheck size={14} />}
                  label="Yapılandırıldı"
                  color="success"
                  size="small"
                />
              )}
              <FormControlLabel
                control={
                  <Switch
                    checked={true}
                    disabled
                    color="primary"
                  />
                }
                label="Aktif"
              />
            </Stack>
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Setup Instructions */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Google Cloud Console Kurulumu
            </Typography>
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              <li>
                <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer">
                  Google Cloud Console
                </a>
                'a gidin
              </li>
              <li>Yeni bir proje oluşturun veya mevcut bir projeyi seçin</li>
              <li>"APIs & Services" → "Credentials" bölümüne gidin</li>
              <li>"Create Credentials" → "OAuth client ID" seçin</li>
              <li>Uygulama türü olarak "Web application" seçin</li>
              <li>Authorized redirect URI olarak aşağıdaki callback URL'i ekleyin</li>
            </ol>
          </Alert>

          {/* Form Fields */}
          <Stack spacing={3}>
            {/* Callback URL (readonly) */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Callback URL (Google'a ekleyin)
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {googleCallbackUrl || getDefaultCallbackUrl()}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(googleCallbackUrl || getDefaultCallbackUrl())}
                  >
                    <IconCopy size={18} />
                  </IconButton>
                </Stack>
              </Paper>
            </Box>

            <TextField
              label="Google Client ID"
              value="134087975400-u824lhqcgnode9ktquqo2gerof6240v6.apps.googleusercontent.com"
              fullWidth
              disabled
              InputProps={{
                endAdornment: <Chip label="Yapılandırıldı" size="small" color="success" />,
              }}
            />

            <TextField
              label="Google Client Secret"
              value="••••••••••••••••••••••••••••••••"
              fullWidth
              disabled
              InputProps={{
                endAdornment: <Chip label="Yapılandırıldı" size="small" color="success" />,
              }}
              helperText="Client Secret şifrelenmiş olarak saklanır"
            />

            <TextField
              label="Callback URL"
              value="https://api.uzmanumre.com/api/auth/google/callback"
              fullWidth
              disabled
              InputProps={{
                endAdornment: <Chip label="Sabit" size="small" color="primary" />,
              }}
            />
          </Stack>

          {/* Delete Button */}
          {config?.googleConfigured && (
            <>
              <Divider sx={{ my: 3 }} />
              <Button
                variant="outlined"
                color="error"
                onClick={handleDeleteConfig}
              >
                Google Yapılandırmasını Sil
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Frontend Integration Guide */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Frontend Entegrasyonu
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Login sayfanıza Google giriş butonu eklemek için aşağıdaki kodu kullanın:
          </Typography>

          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.900' }}>
            <Box
              component="pre"
              sx={{
                color: 'grey.100',
                overflow: 'auto',
                fontSize: '0.75rem',
                margin: 0,
              }}
            >
              {`// 1. Önce aktif sağlayıcıları kontrol edin
const { google } = await fetch('/api/auth/social/providers').then(r => r.json());

// 2. Google ile giriş
if (google.enabled) {
  const handleGoogleLogin = () => {
    const redirectUrl = encodeURIComponent(window.location.pathname);
    window.location.href = \`\${API_URL}/api/auth/google?redirect=\${redirectUrl}\`;
  };
}

// 3. Callback sonrası token'ları yakalayın
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('accessToken');
  const refreshToken = params.get('refreshToken');

  if (accessToken) {
    // Token'ları kaydedin ve yönlendirin
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    // URL'den parametreleri temizleyin
    window.history.replaceState({}, '', window.location.pathname);
  }
}, []);`}
            </Box>
          </Paper>
        </CardContent>
      </Card>

      {/* Future Providers */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Diğer Sağlayıcılar
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Gelecekte eklenecek sosyal giriş sağlayıcıları
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Paper variant="outlined" sx={{ p: 2, opacity: 0.6 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      bgcolor: 'grey.100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
                      alt="Apple"
                      style={{ width: 20, height: 20 }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">Apple Sign In</Typography>
                    <Chip label="Yakında" size="small" variant="outlined" />
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper variant="outlined" sx={{ p: 2, opacity: 0.6 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      bgcolor: '#1877F2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography sx={{ color: 'white', fontWeight: 700 }}>f</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">Facebook</Typography>
                    <Chip label="Yakında" size="small" variant="outlined" />
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SocialAuthConfigPage;
