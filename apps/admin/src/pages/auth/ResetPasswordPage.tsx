import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  TextField,
  Paper,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { IconLock, IconArrowLeft, IconCheck, IconEye, IconEyeOff, IconAlertCircle } from '@tabler/icons-react';
import { apiClient } from '../../api/client';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  // Token doğrulama
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Geçersiz veya eksik şifre sıfırlama linki');
        setVerifying(false);
        return;
      }

      try {
        await apiClient.post('/auth/verify-reset-token', { token });
        setTokenValid(true);
      } catch (err: any) {
        setError('Bu şifre sıfırlama linki geçersiz veya süresi dolmuş. Lütfen yeni bir link talep edin.');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      setError('Yeni şifre gerekli');
      return;
    }

    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır');
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/auth/reset-password', { token, password });
      setSuccess(true);
      // 3 saniye sonra login'e yönlendir
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Şifre sıfırlanırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Loading durumu
  if (verifying) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Paper elevation={24} sx={{ p: 6, borderRadius: 3, textAlign: 'center' }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="h6">Link doğrulanıyor...</Typography>
        </Paper>
      </Box>
    );
  }

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
            <IconLock size={48} color="white" />
          </Box>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Yeni Şifre Belirle
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Güvenli bir şifre belirleyerek hesabınıza erişimi yeniden kazanın
          </Typography>
        </Box>
      </Box>

      {/* Right Side - Form */}
      <Box
        sx={{
          flex: { xs: 1, md: '0 0 500px' },
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
            maxWidth: { xs: '100%', sm: 420 },
            borderRadius: 3,
          }}
        >
          {/* Token geçersiz */}
          {!tokenValid && !success && (
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: 'error.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <IconAlertCircle size={40} color="#f44336" />
              </Box>

              <Typography variant="h4" fontWeight={700} gutterBottom>
                Geçersiz Link
              </Typography>

              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {error}
              </Typography>

              <Stack spacing={2}>
                <Button
                  component={RouterLink}
                  to="/forgot-password"
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                  }}
                >
                  Yeni Link Talep Et
                </Button>

                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  size="large"
                  fullWidth
                  startIcon={<IconArrowLeft size={18} />}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: 2,
                  }}
                >
                  Giriş Sayfasına Dön
                </Button>
              </Stack>
            </Box>
          )}

          {/* Şifre sıfırlama formu */}
          {tokenValid && !success && (
            <>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  Yeni Şifre Belirle
                </Typography>
                <Typography color="text.secondary">
                  Hesabınız için güvenli bir şifre oluşturun
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  <TextField
                    label="Yeni Şifre"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    placeholder="En az 8 karakter"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconLock size={20} style={{ color: '#666' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Şifreyi Tekrarla"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    fullWidth
                    placeholder="Şifrenizi tekrar girin"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconLock size={20} style={{ color: '#666' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            size="small"
                          >
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
                    disabled={loading || !password || !confirmPassword}
                    sx={{
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      borderRadius: 2,
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Şifremi Değiştir'}
                  </Button>
                </Stack>
              </form>
            </>
          )}

          {/* Başarılı */}
          {success && (
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: 'success.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <IconCheck size={40} color="#4caf50" />
              </Box>

              <Typography variant="h4" fontWeight={700} gutterBottom>
                Şifre Değiştirildi!
              </Typography>

              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Şifreniz başarıyla değiştirildi. Giriş sayfasına yönlendiriliyorsunuz...
              </Typography>

              <CircularProgress size={24} sx={{ mb: 2 }} />

              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                size="large"
                fullWidth
                sx={{
                  mt: 2,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 2,
                }}
              >
                Giriş Sayfasına Git
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default ResetPasswordPage;
