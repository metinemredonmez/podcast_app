import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  FormControlLabel,
  Button,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  TextField,
  Checkbox,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import { IconBrandGoogle, IconMail, IconPhone, IconArrowLeft } from '@tabler/icons-react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../api/client';

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

const emailValidationSchema = yup.object({
  email: yup.string().email('Geçerli bir email girin').required('Email gerekli'),
  password: yup.string().min(6, 'Şifre en az 6 karakter olmalı').required('Şifre gerekli'),
});

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, setTokens } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<AuthProviders | null>(null);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Phone login state
  const [phone, setPhone] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState('');
  const [codeLength, setCodeLength] = useState(6);
  const [resendTimer, setResendTimer] = useState(0);

  // Fetch available auth providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await apiClient.get<AuthProviders>('/auth/providers');
        setProviders(response.data);
      } catch {
        // Auth providers not available
      } finally {
        setProvidersLoading(false);
      }
    };
    fetchProviders();
  }, []);

  // Handle OAuth callback tokens
  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(
        errorParam === 'google_auth_failed'
          ? 'Google ile giriş başarısız oldu'
          : 'Giriş hatası oluştu'
      );
      window.history.replaceState({}, '', window.location.pathname);
    } else if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);
      window.history.replaceState({}, '', window.location.pathname);
      navigate('/dashboard');
    }
  }, [searchParams, setTokens, navigate]);

  const handleGoogleLogin = () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const redirectUrl = encodeURIComponent('/login');
    window.location.href = `${apiUrl}/api/auth/google?redirect=${redirectUrl}`;
  };

  const handleSendOtp = async () => {
    if (!phone) return;

    setPhoneLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        maskedPhone: string;
        codeLength: number;
        resendAfter: number;
      }>('/auth/phone/send-otp', { phone });

      setMaskedPhone(response.data.maskedPhone);
      setCodeLength(response.data.codeLength);
      setResendTimer(response.data.resendAfter);
      setShowOtpModal(true);
      setSuccess('Doğrulama kodu gönderildi');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kod gönderilemedi';
      setError(msg);
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleOtpSuccess = (tokens: { accessToken: string; refreshToken: string }) => {
    setTokens(tokens.accessToken, tokens.refreshToken);
    setShowOtpModal(false);
    navigate('/dashboard');
  };

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: emailValidationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);

      try {
        await login(values.email, values.password);
        navigate('/dashboard');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Giriş başarısız';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 3,
      }}
    >
      {/* Branding - Top */}
      <Box
        sx={{
          textAlign: 'center',
          color: 'white',
          mb: 4,
        }}
      >
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
          <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </Box>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Podcast Admin
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Podcastlerinizi, bölümleri ve kullanıcıları tek bir panelden yönetin
        </Typography>
      </Box>

      {/* Login Form - Center */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 420,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={24}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 3,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Hoş Geldiniz
            </Typography>
            <Typography color="text.secondary">
              Admin hesabınıza giriş yapın
            </Typography>
          </Box>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {/* Google Login */}
          {providers?.google?.enabled && (
            <>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={handleGoogleLogin}
                disabled={loading}
                startIcon={<IconBrandGoogle size={20} />}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  borderRadius: 2,
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'text.primary',
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    borderColor: 'primary.main',
                    color: 'white',
                  },
                }}
              >
                Google ile devam et
              </Button>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  veya
                </Typography>
              </Divider>
            </>
          )}

          {/* Email & Phone Tabs */}
          {providers?.phone?.enabled ? (
            <>
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                variant="fullWidth"
                sx={{ mb: 3 }}
              >
                <Tab
                  icon={<IconMail size={18} />}
                  iconPosition="start"
                  label="Email"
                  sx={{ textTransform: 'none' }}
                />
                <Tab
                  icon={<IconPhone size={18} />}
                  iconPosition="start"
                  label="Telefon"
                  sx={{ textTransform: 'none' }}
                />
              </Tabs>

              {activeTab === 0 ? (
                <EmailLoginForm formik={formik} loading={loading} />
              ) : (
                <PhoneLoginForm
                  phone={phone}
                  setPhone={setPhone}
                  loading={phoneLoading}
                  onSubmit={handleSendOtp}
                />
              )}
            </>
          ) : (
            <EmailLoginForm formik={formik} loading={loading} />
          )}

        </Paper>
      </Box>

      {/* OTP Modal */}
      <OtpVerificationModal
        open={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        phone={phone}
        maskedPhone={maskedPhone}
        codeLength={codeLength}
        resendTimer={resendTimer}
        setResendTimer={setResendTimer}
        onSuccess={handleOtpSuccess}
        onResend={handleSendOtp}
      />
    </Box>
  );
};

// Email Login Form Component
interface EmailLoginFormProps {
  formik: ReturnType<typeof useFormik<{ email: string; password: string }>>;
  loading: boolean;
}

const EmailLoginForm: React.FC<EmailLoginFormProps> = ({ formik, loading }) => (
  <form onSubmit={formik.handleSubmit}>
    <Stack spacing={3}>
      <TextField
        id="email"
        name="email"
        label="Email Adresi"
        variant="outlined"
        fullWidth
        value={formik.values.email}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.email && Boolean(formik.errors.email)}
        helperText={formik.touched.email && formik.errors.email}
      />
      <TextField
        id="password"
        name="password"
        label="Şifre"
        type="password"
        variant="outlined"
        fullWidth
        value={formik.values.password}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.password && Boolean(formik.errors.password)}
        helperText={formik.touched.password && formik.errors.password}
      />

      <FormControlLabel
        control={<Checkbox defaultChecked color="primary" />}
        label="Beni hatırla"
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={loading}
        sx={{
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 600,
          textTransform: 'none',
          borderRadius: 2,
        }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Giriş Yap'}
      </Button>

      <Box sx={{ textAlign: 'center' }}>
        <Typography
          component={RouterLink}
          to="/forgot-password"
          variant="body2"
          sx={{
            color: 'primary.main',
            textDecoration: 'none',
            fontWeight: 500,
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          Şifremi Unuttum
        </Typography>
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Hesabınız yok mu?{' '}
          <Typography
            component={RouterLink}
            to="/register"
            variant="body2"
            sx={{
              color: 'primary.main',
              textDecoration: 'none',
              fontWeight: 600,
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            Kayıt Ol
          </Typography>
        </Typography>
      </Box>

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
    </Stack>
  </form>
);

// Phone Login Form Component
interface PhoneLoginFormProps {
  phone: string;
  setPhone: (phone: string) => void;
  loading: boolean;
  onSubmit: () => void;
}

const PhoneLoginForm: React.FC<PhoneLoginFormProps> = ({
  phone,
  setPhone,
  loading,
  onSubmit,
}) => (
  <Stack spacing={3}>
    <TextField
      label="Telefon Numarası"
      value={phone}
      onChange={(e) => setPhone(e.target.value)}
      fullWidth
      placeholder="05XX XXX XX XX"
      InputProps={{
        startAdornment: <IconPhone size={20} style={{ marginRight: 8, color: '#666' }} />,
      }}
    />
    <Typography variant="body2" color="text.secondary">
      Sadece Admin yetkili telefonlar ile giriş yapılabilir
    </Typography>
    <Button
      variant="contained"
      size="large"
      fullWidth
      onClick={onSubmit}
      disabled={!phone || loading}
      sx={{
        py: 1.5,
        fontSize: '1rem',
        fontWeight: 600,
        textTransform: 'none',
        borderRadius: 2,
      }}
    >
      {loading ? <CircularProgress size={24} color="inherit" /> : 'Doğrulama Kodu Gönder'}
    </Button>
  </Stack>
);

// OTP Verification Modal Component
interface OtpModalProps {
  open: boolean;
  onClose: () => void;
  phone: string;
  maskedPhone: string;
  codeLength: number;
  resendTimer: number;
  setResendTimer: (timer: number) => void;
  onSuccess: (tokens: { accessToken: string; refreshToken: string }) => void;
  onResend: () => void;
}

const OtpVerificationModal: React.FC<OtpModalProps> = ({
  open,
  onClose,
  phone,
  maskedPhone,
  codeLength,
  resendTimer,
  setResendTimer,
  onSuccess,
  onResend,
}) => {
  const [otp, setOtp] = useState<string[]>(Array(codeLength).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer, setResendTimer]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setOtp(Array(codeLength).fill(''));
      setError('');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open, codeLength]);

  // Auto-submit when complete
  useEffect(() => {
    const code = otp.join('');
    if (code.length === codeLength && !otp.includes('')) {
      handleVerify(code);
    }
  }, [otp]);

  const handleVerify = async (code: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/phone/verify-otp', { phone, code });
      onSuccess(response.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Doğrulama başarısız';
      setError(msg);
      setOtp(Array(codeLength).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    if (value && index < codeLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, codeLength);
    const newOtp = [...otp];
    pasted.split('').forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
  };

  const handleResend = () => {
    onResend();
    setOtp(Array(codeLength).fill(''));
    setError('');
    inputRefs.current[0]?.focus();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        Doğrulama Kodu
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ py: 2 }}>
          {/* Masked Phone */}
          <Typography textAlign="center" color="text.secondary">
            <strong>{maskedPhone}</strong>
            <br />
            numarasına gönderilen {codeLength} haneli kodu girin
          </Typography>

          {/* OTP Inputs */}
          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            onPaste={handlePaste}
          >
            {otp.map((digit, index) => (
              <TextField
                key={index}
                inputRef={(el) => (inputRefs.current[index] = el)}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                inputProps={{
                  maxLength: 1,
                  style: {
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    padding: '12px 0',
                  },
                  inputMode: 'numeric',
                }}
                sx={{
                  width: { xs: 40, sm: 48 },
                  '& .MuiOutlinedInput-root': {
                    borderColor: error ? 'error.main' : digit ? 'primary.main' : undefined,
                  },
                }}
                disabled={loading}
                error={!!error}
              />
            ))}
          </Stack>

          {/* Error */}
          {error && (
            <Typography color="error" textAlign="center" variant="body2">
              {error}
            </Typography>
          )}

          {/* Loading */}
          {loading && (
            <Box display="flex" justifyContent="center">
              <CircularProgress size={24} />
            </Box>
          )}

          {/* Resend */}
          <Box textAlign="center">
            {resendTimer > 0 ? (
              <Typography variant="body2" color="text.secondary">
                Tekrar göndermek için <strong>{resendTimer}</strong> saniye bekleyin
              </Typography>
            ) : (
              <Button variant="text" onClick={handleResend} disabled={loading}>
                Kodu tekrar gönder
              </Button>
            )}
          </Box>

          {/* Back Button */}
          <Button
            variant="outlined"
            onClick={onClose}
            startIcon={<IconArrowLeft size={18} />}
            disabled={loading}
            fullWidth
          >
            Geri Dön
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default LoginPage;
