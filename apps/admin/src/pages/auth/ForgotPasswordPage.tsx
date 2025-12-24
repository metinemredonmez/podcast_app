import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  TextField,
  Paper,
} from '@mui/material';
import { IconMail, IconArrowLeft, IconCheck } from '@tabler/icons-react';
import { apiClient } from '../../api/client';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Email adresi gerekli');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      // Güvenlik için her zaman başarılı mesajı göster
      setSuccess(true);
    } finally {
      setLoading(false);
    }
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
            <IconMail size={48} color="white" />
          </Box>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Şifre Sıfırlama
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Email adresinize şifre sıfırlama linki göndereceğiz
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
          {!success ? (
            <>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  Şifremi Unuttum
                </Typography>
                <Typography color="text.secondary">
                  Email adresinizi girin, şifre sıfırlama linki gönderelim
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
                    label="Email Adresi"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    placeholder="ornek@email.com"
                    InputProps={{
                      startAdornment: <IconMail size={20} style={{ marginRight: 8, color: '#666' }} />,
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading || !email}
                    sx={{
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      borderRadius: 2,
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Sıfırlama Linki Gönder'}
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
              </form>
            </>
          ) : (
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
                Email Gönderildi!
              </Typography>

              <Typography color="text.secondary" sx={{ mb: 3 }}>
                <strong>{email}</strong> adresine şifre sıfırlama linki gönderdik.
                Lütfen gelen kutunuzu kontrol edin.
              </Typography>

              <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                Email birkaç dakika içinde gelmezse spam/junk klasörünü kontrol edin.
              </Alert>

              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                size="large"
                fullWidth
                startIcon={<IconArrowLeft size={18} />}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 2,
                }}
              >
                Giriş Sayfasına Dön
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default ForgotPasswordPage;
