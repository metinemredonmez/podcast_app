import React from 'react';
import { Box, Typography, Paper, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const PrivacyPage: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Gizlilik Politikası
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Son güncelleme: 24 Aralık 2025
          </Typography>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              1. Toplanan Bilgiler
            </Typography>
            <Typography paragraph>
              Hizmetlerimizi kullanırken aşağıdaki bilgileri toplayabiliriz:
            </Typography>
            <ul>
              <li>Ad, soyad ve iletişim bilgileri</li>
              <li>E-posta adresi</li>
              <li>Telefon numarası</li>
              <li>Kullanım verileri ve tercihler</li>
              <li>Cihaz ve tarayıcı bilgileri</li>
            </ul>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              2. Bilgilerin Kullanımı
            </Typography>
            <Typography paragraph>
              Topladığımız bilgileri aşağıdaki amaçlarla kullanırız:
            </Typography>
            <ul>
              <li>Hesabınızı oluşturmak ve yönetmek</li>
              <li>Hizmetlerimizi sunmak ve geliştirmek</li>
              <li>Sizinle iletişim kurmak</li>
              <li>Güvenliği sağlamak</li>
              <li>Yasal yükümlülüklerimizi yerine getirmek</li>
            </ul>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              3. Bilgi Güvenliği
            </Typography>
            <Typography paragraph>
              Kişisel bilgilerinizi korumak için endüstri standardı güvenlik önlemleri
              kullanıyoruz. Verileriniz şifrelenmiş olarak saklanır ve yetkisiz erişime
              karşı korunur.
            </Typography>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              4. Çerezler
            </Typography>
            <Typography paragraph>
              Web sitemizde deneyiminizi geliştirmek için çerezler kullanıyoruz. Tarayıcı
              ayarlarınızdan çerezleri devre dışı bırakabilirsiniz, ancak bu bazı
              özelliklerin çalışmamasına neden olabilir.
            </Typography>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              5. Üçüncü Taraflar
            </Typography>
            <Typography paragraph>
              Bilgilerinizi yasal zorunluluklar dışında üçüncü taraflarla paylaşmayız.
              Hizmet sağlayıcılarımız (SMS, e-posta vb.) ile sadece hizmet sunumu için
              gerekli bilgileri paylaşırız.
            </Typography>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              6. Haklarınız
            </Typography>
            <Typography paragraph>
              KVKK kapsamında aşağıdaki haklara sahipsiniz:
            </Typography>
            <ul>
              <li>Verilerinize erişim hakkı</li>
              <li>Verilerinizin düzeltilmesini talep etme hakkı</li>
              <li>Verilerinizin silinmesini talep etme hakkı</li>
              <li>Veri işlemeye itiraz etme hakkı</li>
            </ul>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              7. İletişim
            </Typography>
            <Typography paragraph>
              Gizlilik politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz:
              <br />
              E-posta: info@uzmanumre.com
            </Typography>
          </Box>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography
              component={RouterLink}
              to="/login"
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                fontWeight: 600,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              ← Giriş sayfasına dön
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default PrivacyPage;
