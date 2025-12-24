import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
  Divider,
  Badge,
} from '@mui/material';
import {
  IconLayoutDashboard,
  IconMicrophone,
  IconHeadphones,
  IconUsers,
  IconCategory,
  IconMessage,
  IconStar,
  IconChartBar,
  IconUser,
  IconShieldCheck,
  IconBuilding,
  IconBell,
  IconDeviceMobile,
  IconHistory,
  IconBrandGoogle,
  IconSettings,
  IconBroadcast,
  IconUserPlus,
} from '@tabler/icons-react';
import { CustomizerContext } from '../../context/customizerContext';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { moderationService } from '../../api/services/moderation.service';
import { selectUser } from '../../store/slices/authSlice';

interface MenuItem {
  id: string;
  title: string;
  icon: React.ElementType;
  href: string;
  navlabel?: boolean;
  subheader?: string;
  badge?: number;
  roles?: string[]; // Hangi roller bu menüyü görebilir
}

// Rol bazlı menü yapısı
// roles belirtilmezse herkes görebilir
// SUPER_ADMIN ve ADMIN her şeyi görebilir
// HOCA: Dashboard, Canlı Yayın, İçerik Yönetimi, Profil
// USER: Sadece Dashboard ve Profil
const menuItems: MenuItem[] = [
  // Dashboard - herkes görebilir
  { id: 'nav-dashboard', title: 'Dashboard', subheader: 'Kontrol Paneli', navlabel: true, icon: IconLayoutDashboard, href: '' },
  { id: 'dashboard', title: 'Dashboard', icon: IconLayoutDashboard, href: '/dashboard' },
  { id: 'analytics', title: 'Analitik', icon: IconChartBar, href: '/analytics', roles: ['SUPER_ADMIN', 'ADMIN'] },

  // Canlı Yayın - HOCA ve üstü
  { id: 'nav-live', title: 'Live', subheader: 'Canlı Yayın', navlabel: true, icon: IconBroadcast, href: '', roles: ['SUPER_ADMIN', 'ADMIN', 'HOCA'] },
  { id: 'live-streams', title: 'Yayınlar', icon: IconBroadcast, href: '/live', roles: ['SUPER_ADMIN', 'ADMIN', 'HOCA'] },
  { id: 'live-broadcast', title: 'Yayın Başlat', icon: IconMicrophone, href: '/live/broadcast', roles: ['SUPER_ADMIN', 'ADMIN', 'HOCA'] },

  // İçerik Yönetimi - HOCA ve üstü
  { id: 'nav-content', title: 'Content', subheader: 'İçerik Yönetimi', navlabel: true, icon: IconMicrophone, href: '', roles: ['SUPER_ADMIN', 'ADMIN', 'HOCA'] },
  { id: 'podcasts', title: 'Podcastler', icon: IconMicrophone, href: '/podcasts', roles: ['SUPER_ADMIN', 'ADMIN', 'HOCA'] },
  { id: 'episodes', title: 'Bölümler', icon: IconHeadphones, href: '/episodes', roles: ['SUPER_ADMIN', 'ADMIN', 'HOCA'] },
  { id: 'categories', title: 'Kategoriler', icon: IconCategory, href: '/categories', roles: ['SUPER_ADMIN', 'ADMIN'] },

  // Kullanıcı Yönetimi - sadece ADMIN
  { id: 'nav-users', title: 'Users', subheader: 'Kullanıcı Yönetimi', navlabel: true, icon: IconUsers, href: '', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 'users', title: 'Kullanıcılar', icon: IconUsers, href: '/users', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 'hocas', title: 'Hocalar', icon: IconUser, href: '/hocas', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 'hoca-applications', title: 'Hoca Başvuruları', icon: IconUserPlus, href: '/hoca-applications', roles: ['SUPER_ADMIN', 'ADMIN'] },

  // Moderasyon - sadece ADMIN
  { id: 'nav-moderation', title: 'Moderation', subheader: 'Moderasyon', navlabel: true, icon: IconShieldCheck, href: '', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 'moderation', title: 'Moderasyon Kuyruğu', icon: IconShieldCheck, href: '/moderation', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 'comments', title: 'Yorumlar', icon: IconMessage, href: '/comments', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 'reviews', title: 'Değerlendirmeler', icon: IconStar, href: '/reviews', roles: ['SUPER_ADMIN', 'ADMIN'] },

  // Yönetim & Ayarlar - sadece ADMIN
  { id: 'nav-settings', title: 'Settings', subheader: 'Yönetim & Ayarlar', navlabel: true, icon: IconSettings, href: '', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 'tenants', title: 'Tenantlar', icon: IconBuilding, href: '/tenants', roles: ['SUPER_ADMIN'] },
  { id: 'notifications', title: 'Bildirimler', icon: IconBell, href: '/notifications', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 'system-settings', title: 'Sistem Ayarları', icon: IconSettings, href: '/settings', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 'social-auth', title: 'OAuth Detayları', icon: IconBrandGoogle, href: '/settings/social-auth', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 'sms-config', title: 'SMS Detayları', icon: IconDeviceMobile, href: '/settings/sms', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 'push-config', title: 'Push Detayları', icon: IconBell, href: '/push', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 'push-logs', title: 'Push Logları', icon: IconHistory, href: '/push/logs', roles: ['SUPER_ADMIN', 'ADMIN'] },

  // Hesap & Kişisel - herkes görebilir
  { id: 'nav-profile', title: 'Profile', subheader: 'Hesap', navlabel: true, icon: IconUser, href: '' },
  { id: 'profile', title: 'Profilim', icon: IconUser, href: '/profile' },
  { id: 'my-history', title: 'Dinleme Geçmişi', icon: IconHistory, href: '/my-history' },
  { id: 'my-favorites', title: 'Favorilerim', icon: IconStar, href: '/my-favorites' },
];

const Sidebar: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const lgUp = useMediaQuery(theme.breakpoints.up('lg'));
  const { isCollapse, isMobileSidebar, setIsMobileSidebar } = useContext(CustomizerContext);

  // Get current user for role-based menu filtering
  const user = useSelector(selectUser);

  // Pending moderation count
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const stats = await moderationService.getStats();
        setPendingCount(stats.pending || 0);
      } catch {
        setPendingCount(0);
      }
    };

    fetchPendingCount();
    // Refresh every 60 seconds
    const interval = setInterval(fetchPendingCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const sidebarWidth = 270;
  const miniSidebarWidth = 87;
  const isSidebarOpen = isCollapse !== 'mini-sidebar';
  const toggleWidth = isSidebarOpen ? sidebarWidth : miniSidebarWidth;

  const handleNavigation = (href: string) => {
    navigate(href);
    if (!lgUp) {
      setIsMobileSidebar(false);
    }
  };

  // Check if menu item is active (including nested routes)
  const isMenuActive = (href: string): boolean => {
    if (href === '/dashboard' && (location.pathname === '/' || location.pathname === '/dashboard')) {
      return true;
    }
    if (href === '/') return location.pathname === '/';
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  // Filter menu items based on user role
  // SUPER_ADMIN and ADMIN can see everything
  // HOCA can only see items without roles restriction or items that include HOCA
  const canUserSeeItem = (item: MenuItem): boolean => {
    // If no roles specified, everyone can see it
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    // Check if user's role is in the allowed roles
    if (user && item.roles.includes(user.role)) {
      return true;
    }
    return false;
  };

  // Filter menu items and also filter out section headers if no items in that section are visible
  const getFilteredMenuItems = (): MenuItem[] => {
    const result: MenuItem[] = [];
    const addedLabels = new Set<string>();

    for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i];

      if (item.navlabel) {
        // Skip navlabel for now, will be added when we find visible items after it
        continue;
      }

      // Regular menu item - check if user can see it
      if (!canUserSeeItem(item)) {
        continue;
      }

      // Find the navlabel that precedes this item
      let navLabelForItem: MenuItem | null = null;
      for (let j = i - 1; j >= 0; j--) {
        if (menuItems[j].navlabel) {
          navLabelForItem = menuItems[j];
          break;
        }
      }

      // Add the navlabel if not already added and user can see it
      if (navLabelForItem && !addedLabels.has(navLabelForItem.id) && canUserSeeItem(navLabelForItem)) {
        result.push(navLabelForItem);
        addedLabels.add(navLabelForItem.id);
      }

      // Add the menu item
      result.push(item);
    }

    return result;
  };

  const filteredMenuItems = getFilteredMenuItems();

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ px: 3, py: 2.5 }}>
        <Typography variant="h5" fontWeight={600} color="primary">
          {isSidebarOpen ? 'Podcast Admin' : 'PA'}
        </Typography>
      </Box>

      <Divider />

      {/* Menu Items */}
      <SimpleBar style={{ maxHeight: 'calc(100vh - 100px)', flex: 1 }}>
        <List sx={{ px: 2, pt: 1 }}>
          {filteredMenuItems.map((item) => {
            if (item.navlabel) {
              // Hide section headers in mini-sidebar mode
              if (!isSidebarOpen) return null;
              return (
                <Typography
                  key={item.id}
                  variant="caption"
                  sx={{
                    display: 'block',
                    px: 2,
                    pt: 2,
                    pb: 1,
                    color: theme.palette.text.secondary,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {item.subheader}
                </Typography>
              );
            }

            const isSelected = isMenuActive(item.href);
            const Icon = item.icon;
            const showBadge = item.id === 'moderation' && pendingCount > 0;

            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.href)}
                  sx={{
                    borderRadius: '8px',
                    mb: 0.5,
                    backgroundColor: isSelected ? theme.palette.primary.light : 'transparent',
                    color: isSelected ? theme.palette.primary.main : theme.palette.text.primary,
                    justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                    px: isSidebarOpen ? 2 : 1,
                    '&:hover': {
                      backgroundColor: isSelected
                        ? theme.palette.primary.light
                        : theme.palette.action.hover,
                    },
                    // Active indicator
                    ...(isSelected && isSidebarOpen && {
                      borderLeft: `3px solid ${theme.palette.primary.main}`,
                      pl: 1.5,
                    }),
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: isSidebarOpen ? 40 : 'auto',
                      mr: isSidebarOpen ? 0 : 0,
                      color: isSelected ? theme.palette.primary.main : theme.palette.text.secondary,
                    }}
                  >
                    {showBadge ? (
                      <Badge
                        badgeContent={pendingCount}
                        color="error"
                        max={99}
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.65rem',
                            height: 16,
                            minWidth: 16,
                          },
                        }}
                      >
                        <Icon size={20} />
                      </Badge>
                    ) : (
                      <Icon size={20} />
                    )}
                  </ListItemIcon>
                  {isSidebarOpen && (
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{
                        fontWeight: isSelected ? 600 : 400,
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </SimpleBar>
    </Box>
  );

  // Desktop Sidebar
  if (lgUp) {
    return (
      <Box
        sx={{
          width: toggleWidth,
          flexShrink: 0,
          transition: theme.transitions.create('width', {
            duration: theme.transitions.duration.shorter,
          }),
        }}
      >
        <Drawer
          anchor="left"
          open
          variant="permanent"
          PaperProps={{
            sx: {
              width: toggleWidth,
              boxSizing: 'border-box',
              borderRight: `1px solid ${theme.palette.divider}`,
              transition: theme.transitions.create('width', {
                duration: theme.transitions.duration.shorter,
              }),
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      </Box>
    );
  }

  // Mobile Sidebar
  return (
    <Drawer
      anchor="left"
      open={isMobileSidebar}
      onClose={() => setIsMobileSidebar(false)}
      variant="temporary"
      PaperProps={{
        sx: {
          width: sidebarWidth,
          boxShadow: theme.shadows[8],
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};

export default Sidebar;
