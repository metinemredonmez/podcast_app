import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  TextField,
  Paper,
  Divider,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import {
  IconBrandGoogle,
  IconMail,
  IconLock,
  IconUser,
  IconEye,
  IconEyeOff,
  IconPhone,
  IconSchool,
  IconUsers,
  IconCheck,
} from '@tabler/icons-react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { apiClient } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';

interface AuthProviders {
  email: boolean;
  google: {
    enabled: boolean;
    clientId: string | null;
  };
  phone: {
    enabled: boolean;
    codeLength: number;
  };
}

// User validation schema
const userValidationSchema = yup.object({
  name: yup.string().min(2, 'Ad en az 2 karakter olmalı').required('Ad gerekli'),
  email: yup.string().email('Geçerli bir email girin').required('Email gerekli'),
  password: yup.string().min(8, 'Şifre en az 8 karakter olmalı').required('Şifre gerekli'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Şifreler eşleşmiyor')
    .required('Şifre tekrarı gerekli'),
});

// Hoca validation schema
const hocaValidationSchema = yup.object({
  name: yup.string().min(2, 'Ad en az 2 karakter olmalı').required('Ad gerekli'),
  phone: yup
    .string()
    .matches(/^(\+90|0)?[0-9]{10}$/, 'Geçerli bir telefon numarası girin')
    .required('Telefon numarası gerekli'),
  email: yup.string().email('Geçerli bir email girin'),
  bio: yup.string().min(20, 'Kendinizi en az 20 karakterle tanıtın'),
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setTokens } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [providers, setProviders] = useState<AuthProviders | null>(null);

  // Phone verification states
  const [phoneStep, setPhoneStep] = useState<'phone' | 'code' | 'details'>('phone');
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [applicationToken, setApplicationToken] = useState('');

  // Fetch available auth providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await apiClient.get<AuthProviders>('/auth/providers');
        setProviders(response.data);
      } catch {
        // Auth providers not available
      }
    };
    fetchProviders();
  }, []);

  const handleGoogleRegister = () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const redirectUrl = encodeURIComponent('/login');
    window.location.href = `${apiUrl}/api/auth/google?redirect=${redirectUrl}`;
  };

  // User registration form
  const userFormik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: userValidationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.post('/auth/register', {
          tenantId: '1b68c1de-15de-4889-95aa-7ab6b3093111',
          name: values.name,
          email: values.email,
          password: values.password,
          role: 'USER',
        });

        if (response.data.accessToken && response.data.refreshToken) {
          setTokens(response.data.accessToken, response.data.refreshToken);
          navigate('/dashboard');
        } else {
          navigate('/login', { state: { message: 'Kayıt başarılı! Lütfen email adresinizi doğrulayın.' } });
        }
      } catch (err: any) {
        const message = err.response?.data?.message || 'Kayıt başarısız';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
  });

  // Hoca registration form
  const hocaFormik = useFormik({
    initialValues: {
      name: '',
      phone: '',
      email: '',
      bio: '',
      expertise: '',
      organization: '',
      position: '',
    },
    validationSchema: hocaValidationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);

      try {
        // Hoca başvurusu - onay bekleyecek
        await apiClient.post('/auth/hoca-application/submit', {
          applicationToken,
          name: values.name,
          email: values.email || undefined,
          bio: values.bio || undefined,
          expertise: values.expertise || undefined,
          organization: values.organization || undefined,
          position: values.position || undefined,
        });

        // Navigate to application pending page
        navigate('/application-pending', {
          state: {
            phone: hocaFormik.values.phone,
            name: values.name
          }
        });
      } catch (err: any) {
        const message = err.response?.data?.message || 'Başvuru gönderilemedi';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
  });

  // Send verification code
  const handleSendCode = async () => {
    if (!hocaFormik.values.phone) {
      setError('Telefon numarası girin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/auth/hoca-application/send-code', {
        phone: hocaFormik.values.phone,
      });
      setPhoneStep('code');
    } catch (err: any) {
      setError(err.response?.data?.message || 'SMS gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  // Verify code
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length < 4) {
      setError('Doğrulama kodunu girin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/auth/hoca-application/verify-code', {
        phone: hocaFormik.values.phone,
        code: verificationCode,
      });
      setApplicationToken(response.data.applicationToken);
      setPhoneVerified(true);
      setPhoneStep('details');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kod doğrulanamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
    setSuccess(null);
    setPhoneStep('phone');
    setPhoneVerified(false);
    setVerificationCode('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      {/* Left Side - Branding */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
          color: 'white',
        }}
      >
        <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '20px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <IconUser size={48} color="white" />
          </Box>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Hesap Oluştur
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Podcast Admin paneline kayıt olun ve içeriklerinizi yönetmeye başlayın
          </Typography>
        </Box>
      </Box>

      {/* Right Side - Register Form */}
      <Box
        sx={{
          flex: { xs: 1, md: '0 0 520px' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Paper
          elevation={24}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: { xs: '100%', sm: 480 },
            borderRadius: 3,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Kayıt Ol
            </Typography>
            <Typography color="text.secondary">
              Hesap türünüzü seçin
            </Typography>
          </Box>

          {/* Tabs */}
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              mb: 2,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
              },
            }}
          >
            <Tab
              icon={<IconUsers size={20} />}
              iconPosition="start"
              label="Kullanıcı"
            />
            <Tab
              icon={<IconSchool size={20} />}
              iconPosition="start"
              label="Hoca"
            />
          </Tabs>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {/* User Registration Tab */}
          <TabPanel value={tabValue} index={0}>
            {/* Google Register */}
            {providers?.google?.enabled && (
              <>
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={handleGoogleRegister}
                  disabled={loading}
                  startIcon={<IconBrandGoogle size={20} />}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: 2,
                  }}
                >
                  Google ile kayıt ol
                </Button>
                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    veya
                  </Typography>
                </Divider>
              </>
            )}

            <form onSubmit={userFormik.handleSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  name="name"
                  label="Ad Soyad"
                  fullWidth
                  value={userFormik.values.name}
                  onChange={userFormik.handleChange}
                  onBlur={userFormik.handleBlur}
                  error={userFormik.touched.name && Boolean(userFormik.errors.name)}
                  helperText={userFormik.touched.name && userFormik.errors.name}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconUser size={20} style={{ color: '#666' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  name="email"
                  label="Email Adresi"
                  fullWidth
                  value={userFormik.values.email}
                  onChange={userFormik.handleChange}
                  onBlur={userFormik.handleBlur}
                  error={userFormik.touched.email && Boolean(userFormik.errors.email)}
                  helperText={userFormik.touched.email && userFormik.errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconMail size={20} style={{ color: '#666' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  name="password"
                  label="Şifre"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  value={userFormik.values.password}
                  onChange={userFormik.handleChange}
                  onBlur={userFormik.handleBlur}
                  error={userFormik.touched.password && Boolean(userFormik.errors.password)}
                  helperText={userFormik.touched.password && userFormik.errors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconLock size={20} style={{ color: '#666' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                          {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  name="confirmPassword"
                  label="Şifre Tekrarı"
                  type={showConfirmPassword ? 'text' : 'password'}
                  fullWidth
                  value={userFormik.values.confirmPassword}
                  onChange={userFormik.handleChange}
                  onBlur={userFormik.handleBlur}
                  error={userFormik.touched.confirmPassword && Boolean(userFormik.errors.confirmPassword)}
                  helperText={userFormik.touched.confirmPassword && userFormik.errors.confirmPassword}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconLock size={20} style={{ color: '#666' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                          {showConfirmPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{ py: 1.5, fontWeight: 600, textTransform: 'none', borderRadius: 2 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Kayıt Ol'}
                </Button>
              </Stack>
            </form>
          </TabPanel>

          {/* Hoca Registration Tab */}
          <TabPanel value={tabValue} index={1}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Hoca başvuruları incelendikten sonra onaylanır. Onay sonrası size bilgi verilecektir.
            </Alert>

            {/* Step 1: Phone Number */}
            {phoneStep === 'phone' && (
              <Stack spacing={2.5}>
                <TextField
                  name="phone"
                  label="Telefon Numarası"
                  placeholder="5XX XXX XX XX"
                  fullWidth
                  value={hocaFormik.values.phone}
                  onChange={hocaFormik.handleChange}
                  onBlur={hocaFormik.handleBlur}
                  error={hocaFormik.touched.phone && Boolean(hocaFormik.errors.phone)}
                  helperText={hocaFormik.touched.phone && hocaFormik.errors.phone}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconPhone size={20} style={{ color: '#666' }} />
                        <Typography sx={{ ml: 1, color: '#666' }}>+90</Typography>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleSendCode}
                  disabled={loading || !hocaFormik.values.phone}
                  sx={{ py: 1.5, fontWeight: 600, textTransform: 'none', borderRadius: 2 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Doğrulama Kodu Gönder'}
                </Button>
              </Stack>
            )}

            {/* Step 2: Verify Code */}
            {phoneStep === 'code' && (
              <Stack spacing={2.5}>
                <Box sx={{ textAlign: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {hocaFormik.values.phone} numarasına gönderilen kodu girin
                  </Typography>
                </Box>

                <TextField
                  label="Doğrulama Kodu"
                  placeholder="XXXX"
                  fullWidth
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.5rem' } }}
                />

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleVerifyCode}
                  disabled={loading || verificationCode.length < 4}
                  sx={{ py: 1.5, fontWeight: 600, textTransform: 'none', borderRadius: 2 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Doğrula'}
                </Button>

                <Button
                  variant="text"
                  onClick={() => setPhoneStep('phone')}
                  sx={{ textTransform: 'none' }}
                >
                  Numarayı Değiştir
                </Button>
              </Stack>
            )}

            {/* Step 3: Details */}
            {phoneStep === 'details' && (
              <form onSubmit={hocaFormik.handleSubmit}>
                <Stack spacing={2.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip
                      icon={<IconCheck size={16} />}
                      label={`${hocaFormik.values.phone} doğrulandı`}
                      color="success"
                      size="small"
                    />
                  </Box>

                  <TextField
                    name="name"
                    label="Ad Soyad"
                    fullWidth
                    required
                    value={hocaFormik.values.name}
                    onChange={hocaFormik.handleChange}
                    onBlur={hocaFormik.handleBlur}
                    error={hocaFormik.touched.name && Boolean(hocaFormik.errors.name)}
                    helperText={hocaFormik.touched.name && hocaFormik.errors.name}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconUser size={20} style={{ color: '#666' }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    name="email"
                    label="Email Adresi (Opsiyonel)"
                    fullWidth
                    value={hocaFormik.values.email}
                    onChange={hocaFormik.handleChange}
                    onBlur={hocaFormik.handleBlur}
                    error={hocaFormik.touched.email && Boolean(hocaFormik.errors.email)}
                    helperText={hocaFormik.touched.email && hocaFormik.errors.email}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconMail size={20} style={{ color: '#666' }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    name="expertise"
                    label="Uzmanlık Alanı (Opsiyonel)"
                    fullWidth
                    placeholder="Örn: Kur'an-ı Kerim, Hadis, Fıkıh..."
                    value={hocaFormik.values.expertise}
                    onChange={hocaFormik.handleChange}
                  />

                  <TextField
                    name="organization"
                    label="Kurum / Görev Yeri (Opsiyonel)"
                    fullWidth
                    placeholder="Örn: Diyanet İşleri Başkanlığı"
                    value={hocaFormik.values.organization}
                    onChange={hocaFormik.handleChange}
                  />

                  <TextField
                    name="position"
                    label="Unvan / Pozisyon (Opsiyonel)"
                    fullWidth
                    placeholder="Örn: İmam-Hatip, Müftü, Vaiz..."
                    value={hocaFormik.values.position}
                    onChange={hocaFormik.handleChange}
                  />

                  <TextField
                    name="bio"
                    label="Kendinizi Tanıtın (Opsiyonel)"
                    fullWidth
                    multiline
                    rows={3}
                    value={hocaFormik.values.bio}
                    onChange={hocaFormik.handleChange}
                    onBlur={hocaFormik.handleBlur}
                    error={hocaFormik.touched.bio && Boolean(hocaFormik.errors.bio)}
                    helperText={hocaFormik.touched.bio && hocaFormik.errors.bio || 'Eğitim, deneyim, yayınlar vb.'}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading || !hocaFormik.values.name}
                    sx={{ py: 1.5, fontWeight: 600, textTransform: 'none', borderRadius: 2 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Başvuruyu Gönder'}
                  </Button>
                </Stack>
              </form>
            )}
          </TabPanel>

          {/* Login Link */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Zaten hesabınız var mı?{' '}
              <Typography
                component={RouterLink}
                to="/login"
                variant="body2"
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Giriş Yap
              </Typography>
            </Typography>
          </Box>

          {/* Privacy & Terms Links */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <Typography
                component={RouterLink}
                to="/privacy"
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Gizlilik Politikası
              </Typography>
              {' • '}
              <Typography
                component={RouterLink}
                to="/terms"
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Kullanım Şartları
              </Typography>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default RegisterPage;
