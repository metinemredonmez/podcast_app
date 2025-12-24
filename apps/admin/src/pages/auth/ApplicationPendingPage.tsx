import React from 'react';
import { Box, Typography, Paper, Container, Button } from '@mui/material';
import { IconClock, IconCheck, IconPhone, IconMail } from '@tabler/icons-react';
import { Link as RouterLink, useLocation } from 'react-router-dom';

interface LocationState {
  phone?: string;
  name?: string;
}

const ApplicationPendingPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState | null;
  const phone = state?.phone;
  const name = state?.name;
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
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: 5,
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          {/* Success Icon */}
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 4,
              boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
            }}
          >
            <IconCheck size={50} color="white" stroke={3} />
          </Box>

          {/* Title */}
          <Typography variant="h4" fontWeight={700} gutterBottom color="success.main">
            Başvurunuz Alındı!
          </Typography>

          {/* Subtitle */}
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            {name ? `Sayın ${name}, başvurunuz` : 'Başvurunuz'} başarıyla alındı
          </Typography>

          {/* Info Box */}
          <Box
            sx={{
              backgroundColor: 'rgba(103, 126, 234, 0.1)',
              borderRadius: 3,
              p: 3,
              mb: 4,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <IconClock size={24} color="#667eea" />
              <Typography variant="body1" fontWeight={600} sx={{ ml: 1, color: '#667eea' }}>
                Onay Bekleniyor
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Başvurunuz yetkililerimiz tarafından incelenmektedir.
              <br />
              Onaylandığında size bildirim gönderilecektir.
            </Typography>
          </Box>

          {/* Contact Info */}
          {phone && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'grey.100',
                borderRadius: 2,
                p: 2,
                mb: 3,
              }}
            >
              <IconPhone size={20} color="#666" />
              <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                İletişim numaranız: <strong>{phone}</strong>
              </Typography>
            </Box>
          )}

          {/* Steps */}
          <Box sx={{ textAlign: 'left', mb: 4 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
              Sonraki Adımlar:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  flexShrink: 0,
                }}
              >
                <Typography variant="caption" color="white" fontWeight={700}>1</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Başvurunuz yetkililer tarafından incelenir
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: 'grey.300',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  flexShrink: 0,
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={700}>2</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Onaylandığında SMS ile bilgilendirilirsiniz
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: 'grey.300',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  flexShrink: 0,
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={700}>3</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Giriş yaparak içerik eklemeye başlayabilirsiniz
              </Typography>
            </Box>
          </Box>

          {/* Contact Support */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <IconMail size={18} color="#666" />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              Sorularınız için: <strong>info@uzmanumre.com</strong>
            </Typography>
          </Box>

          {/* Back Button */}
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            size="large"
            fullWidth
            sx={{
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Giriş Sayfasına Dön
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default ApplicationPendingPage;
