import React from 'react';
import { Box, Typography, Paper, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const TermsPage: React.FC = () => {
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
            Kullanım Şartları
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Son güncelleme: 24 Aralık 2025
          </Typography>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              1. Kabul
            </Typography>
            <Typography paragraph>
              Bu platformu kullanarak aşağıdaki şartları kabul etmiş sayılırsınız.
              Bu şartları kabul etmiyorsanız, lütfen platformumuzu kullanmayın.
            </Typography>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              2. Hesap Oluşturma
            </Typography>
            <Typography paragraph>
              Hesap oluşturmak için:
            </Typography>
            <ul>
              <li>18 yaşından büyük olmalısınız</li>
              <li>Doğru ve güncel bilgiler vermelisiniz</li>
              <li>Hesap güvenliğinizden siz sorumlusunuz</li>
              <li>Hesabınızı başkasıyla paylaşmamalısınız</li>
            </ul>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              3. Hoca Başvuruları
            </Typography>
            <Typography paragraph>
              Hoca olarak başvurmak için:
            </Typography>
            <ul>
              <li>Gerçek kimlik bilgilerinizi vermelisiniz</li>
              <li>Telefon numaranızı doğrulamalısınız</li>
              <li>Başvurunuz incelenecek ve onaylanması gerekecektir</li>
              <li>Yanlış bilgi vermek hesabınızın kapatılmasına neden olabilir</li>
            </ul>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              4. İçerik Kuralları
            </Typography>
            <Typography paragraph>
              Platformda paylaşılan içerikler için:
            </Typography>
            <ul>
              <li>İslami değerlere uygun olmalıdır</li>
              <li>Telif haklarına saygılı olunmalıdır</li>
              <li>Nefret söylemi ve ayrımcılık yasaktır</li>
              <li>Yanıltıcı bilgi paylaşımı yasaktır</li>
            </ul>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              5. Fikri Mülkiyet
            </Typography>
            <Typography paragraph>
              Platform üzerindeki tüm içerik, tasarım ve kodlar telif hakkı ile
              korunmaktadır. İzinsiz kopyalama, dağıtım veya değiştirme yasaktır.
            </Typography>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              6. Sorumluluk Reddi
            </Typography>
            <Typography paragraph>
              Platform "olduğu gibi" sunulmaktadır. Kesintisiz veya hatasız çalışacağını
              garanti etmiyoruz. Kullanıcı içeriklerinden platform sorumlu değildir.
            </Typography>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              7. Hesap Askıya Alma
            </Typography>
            <Typography paragraph>
              Aşağıdaki durumlarda hesabınız askıya alınabilir veya kapatılabilir:
            </Typography>
            <ul>
              <li>Kullanım şartlarının ihlali</li>
              <li>Yanlış veya yanıltıcı bilgi verilmesi</li>
              <li>Diğer kullanıcılara zarar verici davranışlar</li>
              <li>Yasal olmayan faaliyetler</li>
            </ul>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              8. Değişiklikler
            </Typography>
            <Typography paragraph>
              Bu şartları önceden haber vermeksizin değiştirme hakkımız saklıdır.
              Değişiklikler yayınlandığı anda geçerli olur.
            </Typography>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              9. İletişim
            </Typography>
            <Typography paragraph>
              Sorularınız için:
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

export default TermsPage;
