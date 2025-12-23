import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
} from '@tabler/icons-react';
import { CustomizerContext } from '../../context/customizerContext';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { moderationService } from '../../api/services/moderation.service';

interface MenuItem {
  id: string;
  title: string;
  icon: React.ElementType;
  href: string;
  navlabel?: boolean;
  subheader?: string;
  badge?: number;
}

const menuItems: MenuItem[] = [
  { id: 'nav-dashboard', title: 'Dashboard', subheader: 'Kontrol Paneli', navlabel: true, icon: IconLayoutDashboard, href: '' },
  { id: 'dashboard', title: 'Dashboard', icon: IconLayoutDashboard, href: '/dashboard' },
  { id: 'analytics', title: 'Analitik', icon: IconChartBar, href: '/analytics' },

  { id: 'nav-live', title: 'Live', subheader: 'Canlı Yayın', navlabel: true, icon: IconBroadcast, href: '' },
  { id: 'live-streams', title: 'Yayınlar', icon: IconBroadcast, href: '/live' },
  { id: 'live-broadcast', title: 'Yayın Başlat', icon: IconMicrophone, href: '/live/broadcast' },

  { id: 'nav-content', title: 'Content', subheader: 'Content Management', navlabel: true, icon: IconMicrophone, href: '' },
  { id: 'podcasts', title: 'Podcasts', icon: IconMicrophone, href: '/podcasts' },
  { id: 'episodes', title: 'Episodes', icon: IconHeadphones, href: '/episodes' },
  { id: 'categories', title: 'Categories', icon: IconCategory, href: '/categories' },

  { id: 'nav-users', title: 'Users', subheader: 'User Management', navlabel: true, icon: IconUsers, href: '' },
  { id: 'users', title: 'Users', icon: IconUsers, href: '/users' },
  { id: 'hocas', title: 'Hocas', icon: IconUser, href: '/hocas' },

  { id: 'nav-moderation', title: 'Moderation', subheader: 'Moderation', navlabel: true, icon: IconShieldCheck, href: '' },
  { id: 'moderation', title: 'Moderation Queue', icon: IconShieldCheck, href: '/moderation' },
  { id: 'comments', title: 'Comments', icon: IconMessage, href: '/comments' },
  { id: 'reviews', title: 'Reviews', icon: IconStar, href: '/reviews' },

  { id: 'nav-admin', title: 'Admin', subheader: 'Administration', navlabel: true, icon: IconBuilding, href: '' },
  { id: 'tenants', title: 'Tenants', icon: IconBuilding, href: '/tenants' },
  { id: 'notifications', title: 'Notifications', icon: IconBell, href: '/notifications' },

  { id: 'nav-settings', title: 'Settings', subheader: 'Ayarlar', navlabel: true, icon: IconSettings, href: '' },
  { id: 'system-settings', title: 'Sistem Ayarları', icon: IconSettings, href: '/settings' },
  { id: 'social-auth', title: 'OAuth Detayları', icon: IconBrandGoogle, href: '/settings/social-auth' },
  { id: 'sms-config', title: 'SMS Detayları', icon: IconDeviceMobile, href: '/settings/sms' },
  { id: 'push-config', title: 'Push Detayları', icon: IconBell, href: '/push' },
  { id: 'push-logs', title: 'Push Logları', icon: IconHistory, href: '/push/logs' },
];

const Sidebar: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const lgUp = useMediaQuery(theme.breakpoints.up('lg'));
  const { isCollapse, isMobileSidebar, setIsMobileSidebar } = useContext(CustomizerContext);

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
          {menuItems.map((item) => {
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
