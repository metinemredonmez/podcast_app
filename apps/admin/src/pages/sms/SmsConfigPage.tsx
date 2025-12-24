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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  LinearProgress,
} from '@mui/material';
import {
  IconPhone,
  IconMessage,
  IconTestPipe,
  IconEye,
  IconEyeOff,
  IconCheck,
  IconX,
  IconRefresh,
  IconSettings,
  IconChartBar,
  IconHistory,
  IconWallet,
} from '@tabler/icons-react';
import { apiClient } from '../../api/client';
import { logger } from '../../utils/logger';

interface SmsConfig {
  isEnabled: boolean;
  provider: string;
  // NetGSM
  netgsmUsercode: string | null;
  hasNetgsmPassword: boolean;
  netgsmMsgHeader: string | null;
  // Twilio
  twilioAccountSid: string | null;
  hasTwilioAuthToken: boolean;
  twilioFromNumber: string | null;
  twilioVerifyServiceSid: string | null;
  // OTP settings
  otpLength: number;
  otpExpiryMins: number;
  maxAttempts: number;
  resendCooldown: number;
  updatedAt: string | null;
}

interface SmsStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  last24Hours: { sent: number; delivered: number; failed: number };
  last7Days: { sent: number; delivered: number; failed: number };
}

interface SmsLog {
  id: string;
  phone: string;
  message: string;
  type: string;
  provider: string;
  status: string;
  errorMsg: string | null;
  sentAt: string | null;
  createdAt: string;
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

const SmsConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<SmsConfig | null>(null);
  const [stats, setStats] = useState<SmsStats | null>(null);
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(0);
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Form state
  const [isEnabled, setIsEnabled] = useState(false);
  const [provider, setProvider] = useState<'NETGSM' | 'TWILIO'>('NETGSM');
  // NetGSM
  const [netgsmUsercode, setNetgsmUsercode] = useState('');
  const [netgsmPassword, setNetgsmPassword] = useState('');
  const [netgsmMsgHeader, setNetgsmMsgHeader] = useState('');
  // Twilio
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioFromNumber, setTwilioFromNumber] = useState('');
  const [twilioVerifyServiceSid, setTwilioVerifyServiceSid] = useState('');
  // OTP settings
  const [otpLength, setOtpLength] = useState(6);
  const [otpExpiryMins, setOtpExpiryMins] = useState(5);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [resendCooldown, setResendCooldown] = useState(60);

  // Test SMS
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchStats();
  }, []);

  useEffect(() => {
    if (tabValue === 2) {
      fetchLogs();
    }
  }, [tabValue, logsPage]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<SmsConfig>('/admin/sms/config');
      const data = response.data;
      setConfig(data);

      if (data) {
        setIsEnabled(data.isEnabled);
        setProvider((data.provider as 'NETGSM' | 'TWILIO') || 'NETGSM');
        // NetGSM
        setNetgsmUsercode(data.netgsmUsercode || '');
        setNetgsmMsgHeader(data.netgsmMsgHeader || '');
        // Twilio
        setTwilioAccountSid(data.twilioAccountSid || '');
        setTwilioFromNumber(data.twilioFromNumber || '');
        setTwilioVerifyServiceSid(data.twilioVerifyServiceSid || '');
        // OTP settings
        setOtpLength(data.otpLength);
        setOtpExpiryMins(data.otpExpiryMins);
        setMaxAttempts(data.maxAttempts);
        setResendCooldown(data.resendCooldown);
      }
    } catch (err) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status !== 404) {
        setError('Konfigürasyon yüklenemedi');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get<SmsStats>('/admin/sms/stats');
      setStats(response.data);
    } catch (err) {
      logger.error('Failed to load stats:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await apiClient.get<{ logs: SmsLog[]; total: number }>(
        `/admin/sms/logs?page=${logsPage + 1}&limit=10`
      );
      setLogs(response.data.logs);
      setLogsTotal(response.data.total);
    } catch (err) {
      logger.error('Failed to load logs:', err);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await apiClient.get<{ success: boolean; balance?: number }>(
        '/admin/sms/balance'
      );
      if (response.data.success) {
        setBalance(response.data.balance || 0);
      }
    } catch (err) {
      logger.error('Failed to load balance:', err);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload: Record<string, unknown> = {
        isEnabled,
        provider,
        otpLength,
        otpExpiryMins,
        maxAttempts,
        resendCooldown,
      };

      // NetGSM fields
      if (netgsmUsercode) payload.netgsmUsercode = netgsmUsercode;
      if (netgsmPassword) payload.netgsmPassword = netgsmPassword;
      if (netgsmMsgHeader) payload.netgsmMsgHeader = netgsmMsgHeader;
      // Twilio fields
      if (twilioAccountSid) payload.twilioAccountSid = twilioAccountSid;
      if (twilioAuthToken) payload.twilioAuthToken = twilioAuthToken;
      if (twilioFromNumber) payload.twilioFromNumber = twilioFromNumber;
      if (twilioVerifyServiceSid) payload.twilioVerifyServiceSid = twilioVerifyServiceSid;

      await apiClient.put('/admin/sms/config', payload);

      setSuccess('Konfigürasyon kaydedildi');
      setNetgsmPassword('');
      fetchConfig();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kaydetme başarısız';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setError(null);

      const response = await apiClient.post<{ success: boolean; message: string }>(
        '/admin/sms/test'
      );

      if (response.data.success) {
        setSuccess(response.data.message);
        fetchBalance();
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Test başarısız';
      setError(message);
    } finally {
      setTesting(false);
    }
  };

  const handleSendTestSms = async () => {
    if (!testPhone) return;

    try {
      setTesting(true);
      setError(null);

      const response = await apiClient.post<{ success: boolean; message: string }>(
        '/admin/sms/test-send',
        { phone: testPhone, message: testMessage || undefined }
      );

      if (response.data.success) {
        setSuccess(response.data.message);
        setTestPhone('');
        setTestMessage('');
        fetchLogs();
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Test SMS gönderilemedi';
      setError(message);
    } finally {
      setTesting(false);
    }
  };

  const handleDeleteConfig = async () => {
    if (!confirm('SMS yapılandırmasını silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await apiClient.delete('/admin/sms/config');
      setSuccess('SMS yapılandırması silindi');
      setIsEnabled(false);
      setNetgsmUsercode('');
      setNetgsmPassword('');
      setNetgsmMsgHeader('');
      fetchConfig();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Silme başarısız';
      setError(message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT':
      case 'DELIVERED':
        return 'success';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
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
            SMS Ayarları
          </Typography>
          <Typography variant="body2" color="text.secondary">
            SMS entegrasyonu (NetGSM / Twilio) ve OTP ayarları
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<IconTestPipe size={18} />}
            onClick={handleTestConnection}
            disabled={(!config?.hasNetgsmPassword && !config?.hasTwilioAuthToken) || testing}
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

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Toplam SMS
                    </Typography>
                    <Typography variant="h4" fontWeight={600}>
                      {stats.totalSent.toLocaleString()}
                    </Typography>
                  </Box>
                  <IconMessage size={32} color="#666" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Başarılı
                    </Typography>
                    <Typography variant="h4" fontWeight={600} color="success.main">
                      {stats.totalDelivered.toLocaleString()}
                    </Typography>
                  </Box>
                  <IconCheck size={32} color="#4caf50" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Başarısız
                    </Typography>
                    <Typography variant="h4" fontWeight={600} color="error.main">
                      {stats.totalFailed.toLocaleString()}
                    </Typography>
                  </Box>
                  <IconX size={32} color="#f44336" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Bakiye
                    </Typography>
                    <Typography variant="h4" fontWeight={600}>
                      {balance !== null ? `${balance} SMS` : '-'}
                    </Typography>
                  </Box>
                  <IconButton onClick={fetchBalance} size="small">
                    <IconRefresh size={20} />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Main Config Card */}
      <Card>
        <CardContent>
          {/* Enable/Disable */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: isEnabled ? 'primary.lighter' : 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconPhone size={28} color={isEnabled ? '#1976d2' : '#9e9e9e'} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Telefon ile Giriş
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Admin'lerin telefon numarası ile OTP kullanarak giriş yapması
                </Typography>
              </Box>
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  color="primary"
                />
              }
              label={isEnabled ? 'Aktif' : 'Pasif'}
            />
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Provider Selection */}
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              SMS Sağlayıcı
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant={provider === 'NETGSM' ? 'contained' : 'outlined'}
                onClick={() => setProvider('NETGSM')}
                sx={{ minWidth: 120 }}
              >
                NetGSM
              </Button>
              <Button
                variant={provider === 'TWILIO' ? 'contained' : 'outlined'}
                onClick={() => setProvider('TWILIO')}
                sx={{ minWidth: 120 }}
              >
                Twilio
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Tabs */}
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab icon={<IconSettings size={18} />} iconPosition="start" label={provider === 'TWILIO' ? 'Twilio' : 'NetGSM'} />
            <Tab icon={<IconChartBar size={18} />} iconPosition="start" label="OTP" />
            <Tab icon={<IconHistory size={18} />} iconPosition="start" label="Loglar" />
          </Tabs>

          {/* Provider Settings Tab */}
          <TabPanel value={tabValue} index={0}>
            {provider === 'NETGSM' ? (
              <>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    NetGSM Hesap Bilgileri
                  </Typography>
                  <Typography variant="body2">
                    NetGSM hesabınızı{' '}
                    <a href="https://www.netgsm.com.tr" target="_blank" rel="noopener noreferrer">
                      netgsm.com.tr
                    </a>
                    {' '}adresinden oluşturabilirsiniz. API bilgilerinizi "Ayarlar" → "API Bilgileri" bölümünden alabilirsiniz.
                  </Typography>
                </Alert>

                <Stack spacing={3}>
                  <TextField
                    label="Kullanıcı Kodu (Usercode)"
                    value={netgsmUsercode}
                    onChange={(e) => setNetgsmUsercode(e.target.value)}
                    fullWidth
                    placeholder="8501234567"
                    InputProps={{
                      endAdornment: config?.netgsmUsercode && (
                        <Chip label="Yapılandırıldı" size="small" color="success" />
                      ),
                    }}
                  />

                  <TextField
                    label="API Şifresi (Password)"
                    value={netgsmPassword}
                    onChange={(e) => setNetgsmPassword(e.target.value)}
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    placeholder={config?.hasNetgsmPassword ? '••••••••••••' : 'NetGSM API şifrenizi girin'}
                    InputProps={{
                      endAdornment: (
                        <Stack direction="row" spacing={1}>
                          {config?.hasNetgsmPassword && (
                            <Chip label="Yapılandırıldı" size="small" color="success" />
                          )}
                          <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                          </IconButton>
                        </Stack>
                      ),
                    }}
                    helperText="Şifre şifrelenmiş olarak saklanır"
                  />

                  <TextField
                    label="Mesaj Başlığı (Sender ID)"
                    value={netgsmMsgHeader}
                    onChange={(e) => setNetgsmMsgHeader(e.target.value)}
                    fullWidth
                    placeholder="FIRMAADI"
                    helperText="NetGSM panelinde tanımlı mesaj başlığınız"
                    InputProps={{
                      endAdornment: config?.netgsmMsgHeader && (
                        <Chip label="Yapılandırıldı" size="small" color="success" />
                      ),
                    }}
                  />
                </Stack>
              </>
            ) : (
              <>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Twilio Hesap Bilgileri
                  </Typography>
                  <Typography variant="body2">
                    Twilio hesabınızı{' '}
                    <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer">
                      console.twilio.com
                    </a>
                    {' '}adresinden oluşturabilirsiniz. Account SID ve Auth Token ana sayfada görünür.
                  </Typography>
                </Alert>

                <Stack spacing={3}>
                  <TextField
                    label="Account SID"
                    value={twilioAccountSid}
                    onChange={(e) => setTwilioAccountSid(e.target.value)}
                    fullWidth
                    placeholder="AC..."
                    InputProps={{
                      endAdornment: config?.twilioAccountSid && (
                        <Chip label="Yapılandırıldı" size="small" color="success" />
                      ),
                    }}
                    helperText="Twilio Console ana sayfasında görünür"
                  />

                  <TextField
                    label="Auth Token"
                    value={twilioAuthToken}
                    onChange={(e) => setTwilioAuthToken(e.target.value)}
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    placeholder={config?.hasTwilioAuthToken ? '••••••••••••' : 'Twilio Auth Token'}
                    InputProps={{
                      endAdornment: (
                        <Stack direction="row" spacing={1}>
                          {config?.hasTwilioAuthToken && (
                            <Chip label="Yapılandırıldı" size="small" color="success" />
                          )}
                          <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                          </IconButton>
                        </Stack>
                      ),
                    }}
                    helperText="Token şifrelenmiş olarak saklanır"
                  />

                  <TextField
                    label="Gönderen Numara (From Number)"
                    value={twilioFromNumber}
                    onChange={(e) => setTwilioFromNumber(e.target.value)}
                    fullWidth
                    placeholder="+1234567890"
                    helperText="Twilio'dan aldığınız telefon numarası"
                    InputProps={{
                      endAdornment: config?.twilioFromNumber && (
                        <Chip label="Yapılandırıldı" size="small" color="success" />
                      ),
                    }}
                  />

                  <TextField
                    label="Verify Service SID (Opsiyonel)"
                    value={twilioVerifyServiceSid}
                    onChange={(e) => setTwilioVerifyServiceSid(e.target.value)}
                    fullWidth
                    placeholder="VA..."
                    helperText="Twilio Verify servisi kullanacaksanız. Opsiyonel."
                    InputProps={{
                      endAdornment: config?.twilioVerifyServiceSid && (
                        <Chip label="Yapılandırıldı" size="small" color="success" />
                      ),
                    }}
                  />
                </Stack>
              </>
            )}

            {/* Test SMS */}
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Test SMS Gönder
            </Typography>

            <Stack direction="row" spacing={2} mt={2}>
              <TextField
                label="Telefon Numarası"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="05XX XXX XX XX"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Mesaj (İsteğe bağlı)"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Test mesajı"
                sx={{ flex: 2 }}
              />
              <Button
                variant="outlined"
                onClick={handleSendTestSms}
                disabled={!testPhone || testing}
                sx={{ minWidth: 120 }}
              >
                {testing ? <CircularProgress size={20} /> : 'Gönder'}
              </Button>
            </Stack>
          </TabPanel>

          {/* OTP Settings Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="OTP Kod Uzunluğu"
                  type="number"
                  value={otpLength}
                  onChange={(e) => setOtpLength(parseInt(e.target.value, 10) || 6)}
                  fullWidth
                  inputProps={{ min: 4, max: 8 }}
                  helperText="4-8 hane arasında"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="OTP Geçerlilik Süresi (dakika)"
                  type="number"
                  value={otpExpiryMins}
                  onChange={(e) => setOtpExpiryMins(parseInt(e.target.value, 10) || 5)}
                  fullWidth
                  inputProps={{ min: 1, max: 30 }}
                  helperText="1-30 dakika arasında"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Maksimum Deneme Hakkı"
                  type="number"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(parseInt(e.target.value, 10) || 3)}
                  fullWidth
                  inputProps={{ min: 1, max: 10 }}
                  helperText="Hatalı kod girişi limiti"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Yeniden Gönderme Bekleme Süresi (saniye)"
                  type="number"
                  value={resendCooldown}
                  onChange={(e) => setResendCooldown(parseInt(e.target.value, 10) || 60)}
                  fullWidth
                  inputProps={{ min: 30, max: 300 }}
                  helperText="30-300 saniye arasında"
                />
              </Grid>
            </Grid>

            <Paper variant="outlined" sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Özet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kullanıcılar {otpLength} haneli bir kod alacak, bu kod {otpExpiryMins} dakika geçerli olacak.
                {maxAttempts} hatalı denemeden sonra yeni kod istenmeli.
                Kodlar arası minimum {resendCooldown} saniye beklenmeli.
              </Typography>
            </Paper>
          </TabPanel>

          {/* SMS Logs Tab */}
          <TabPanel value={tabValue} index={2}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tarih</TableCell>
                    <TableCell>Telefon</TableCell>
                    <TableCell>Tip</TableCell>
                    <TableCell>Mesaj</TableCell>
                    <TableCell>Durum</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleString('tr-TR')}
                      </TableCell>
                      <TableCell>{log.phone}</TableCell>
                      <TableCell>
                        <Chip
                          label={log.type}
                          size="small"
                          color={log.type === 'OTP' ? 'primary' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.message}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.status}
                          size="small"
                          color={getStatusColor(log.status) as any}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="text.secondary">Henüz SMS kaydı yok</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={logsTotal}
              page={logsPage}
              onPageChange={(_, page) => setLogsPage(page)}
              rowsPerPage={10}
              rowsPerPageOptions={[10]}
            />
          </TabPanel>

          {/* Delete Config */}
          {config?.hasNetgsmPassword && (
            <>
              <Divider sx={{ my: 3 }} />
              <Button variant="outlined" color="error" onClick={handleDeleteConfig}>
                SMS Yapılandırmasını Sil
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SmsConfigPage;
