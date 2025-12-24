import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Grid,
  TextField,
  Button,
  Divider,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { IconUser, IconMail, IconShield, IconCamera, IconLock } from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../api/services/user.service';

// Rol isimlerini Türkçeleştir
const getRoleDisplayName = (role: string | undefined): string => {
  const roleNames: Record<string, string> = {
    SUPER_ADMIN: 'Süper Admin',
    ADMIN: 'Yönetici',
    HOCA: 'Hoca',
    USER: 'Kullanıcı',
    GUEST: 'Misafir',
  };
  return role ? roleNames[role] || role : 'Kullanıcı';
};

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const updatedUser = await userService.updateProfile({ name: formData.name });
      // Update user in auth context
      if (user) {
        updateUser({
          ...user,
          name: (updatedUser as any).name || updatedUser.name,
        });
      }
      setMessage({ type: 'success', text: 'Profil başarıyla güncellendi' });
      setIsEditing(false);
    } catch {
      setMessage({ type: 'error', text: 'Profil güncellenirken bir hata oluştu' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
    });
    setIsEditing(false);
    setMessage(null);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Lütfen geçerli bir resim dosyası seçin' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Dosya boyutu 5MB\'dan küçük olmalı' });
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setIsUploadingAvatar(true);
    setMessage(null);

    try {
      const updatedUser = await userService.uploadAvatar(file);
      // Update user in auth context with new avatar (backend returns avatarUrl)
      if (user) {
        updateUser({
          ...user,
          avatar: (updatedUser as any).avatarUrl || updatedUser.avatar,
        });
      }
      setMessage({ type: 'success', text: 'Profil fotoğrafı güncellendi' });
    } catch {
      setMessage({ type: 'error', text: 'Fotoğraf yüklenirken bir hata oluştu' });
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordSave = async () => {
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Tüm alanları doldurun' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Yeni şifre en az 6 karakter olmalı' });
      return;
    }

    setIsChangingPassword(true);
    setMessage(null);

    try {
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setMessage({ type: 'success', text: 'Şifre başarıyla değiştirildi' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Şifre değiştirilirken bir hata oluştu';
      setMessage({ type: 'error', text: errorMessage === 'Current password is incorrect.' ? 'Mevcut şifre yanlış' : errorMessage });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} mb={3}>
        Profil
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Info Card */}
        <Grid item xs={12} lg={4} md={5}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                style={{ display: 'none' }}
              />

              {/* Avatar with upload button */}
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <Avatar
                  src={avatarPreview || user?.avatar}
                  alt={user?.name || 'User'}
                  sx={{
                    width: 120,
                    height: 120,
                    fontSize: '3rem',
                    bgcolor: 'primary.main',
                  }}
                >
                  {user?.name?.charAt(0) || 'U'}
                </Avatar>

                {/* Upload overlay button */}
                <IconButton
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'primary.main',
                    color: 'white',
                    width: 36,
                    height: 36,
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '&:disabled': {
                      bgcolor: 'grey.400',
                    },
                  }}
                >
                  {isUploadingAvatar ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <IconCamera size={18} />
                  )}
                </IconButton>
              </Box>
              <Typography variant="h5" fontWeight={600}>
                {user?.name || 'Admin User'}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                {user?.email || ''}
              </Typography>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mt: 2,
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                }}
              >
                <IconShield size={16} />
                <Typography variant="caption" fontWeight={600}>
                  {getRoleDisplayName(user?.role)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Edit Card */}
        <Grid item xs={12} lg={8} md={7}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={600}>
                  Profil Bilgileri
                </Typography>
                {!isEditing && (
                  <Button variant="outlined" onClick={() => setIsEditing(true)}>
                    Düzenle
                  </Button>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Stack spacing={3}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <IconUser size={18} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Ad Soyad
                    </Typography>
                  </Stack>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      size="small"
                    />
                  ) : (
                    <Typography>{user?.name || '-'}</Typography>
                  )}
                </Box>

                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <IconMail size={18} />
                    <Typography variant="subtitle2" color="text.secondary">
                      E-posta
                    </Typography>
                  </Stack>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      size="small"
                      type="email"
                    />
                  ) : (
                    <Typography>{user?.email || '-'}</Typography>
                  )}
                </Box>

                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <IconShield size={18} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Hesap Türü
                    </Typography>
                  </Stack>
                  <Typography>{getRoleDisplayName(user?.role)}</Typography>
                </Box>
              </Stack>

              {isEditing && (
                <Stack direction="row" spacing={2} mt={4}>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={isSaving}
                    startIcon={isSaving ? <CircularProgress size={16} /> : null}
                  >
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                  <Button variant="outlined" onClick={handleCancel} disabled={isSaving}>
                    İptal
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Password Change Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <IconLock size={20} />
                <Typography variant="h6" fontWeight={600}>
                  Şifre Değiştir
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="password"
                    name="currentPassword"
                    label="Mevcut Şifre"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="password"
                    name="newPassword"
                    label="Yeni Şifre"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    size="small"
                    helperText="En az 6 karakter"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="password"
                    name="confirmPassword"
                    label="Yeni Şifre (Tekrar)"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Box mt={3}>
                <Button
                  variant="contained"
                  onClick={handlePasswordSave}
                  disabled={isChangingPassword}
                  startIcon={isChangingPassword ? <CircularProgress size={16} /> : null}
                >
                  {isChangingPassword ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;
