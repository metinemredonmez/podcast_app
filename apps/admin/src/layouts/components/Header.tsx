import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  Avatar,
  Divider,
  useMediaQuery,
  useTheme,
  Badge,
  Paper,
  MenuList,
  MenuItem as MuiMenuItem,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  IconMenu2,
  IconMoon,
  IconSun,
  IconBell,
  IconLogout,
  IconUser,
  IconSettings,
} from '@tabler/icons-react';
import { CustomizerContext } from '../../context/customizerContext';
import { useAuth } from '../../hooks/useAuth';
import { notificationService, Notification } from '../../api/services/notification.service';

const Header: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const lgUp = useMediaQuery(theme.breakpoints.up('lg'));
  const {
    activeMode,
    setActiveMode,
    isCollapse,
    setIsCollapse,
    setIsMobileSidebar,
  } = useContext(CustomizerContext);
  const topbarHeight = 70;
  const { user, logout } = useAuth();

  // Admin rolleri kontrolü
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const toggleTheme = () => {
    setActiveMode(activeMode === 'light' ? 'dark' : 'light');
  };

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await notificationService.getNotifications({ limit: 5 });
        setNotifications(response.data || []);
        // Only show badge count for actual unread notifications (not total)
        // Since we don't have unread count from backend, show count of recent items
        setNotificationCount(response.data?.length || 0);
      } catch {
        // Silently fail - show empty state
        setNotifications([]);
        setNotificationCount(0);
      }
    };

    fetchNotifications();
    // Refresh every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileToggle = () => {
    setProfileOpen((prev) => !prev);
    setNotificationOpen(false);
  };

  const handleNotificationToggle = () => {
    setNotificationOpen((prev) => !prev);
    setProfileOpen(false);
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/login');
  };

  const AppBarStyled = styled(AppBar)(() => ({
    boxShadow: 'none',
    background: theme.palette.background.paper,
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
    borderBottom: `1px solid ${theme.palette.divider}`,
    [theme.breakpoints.up('lg')]: {
      minHeight: topbarHeight,
    },
  }));

  const ToolbarStyled = styled(Toolbar)(() => ({
    width: '100%',
    color: theme.palette.text.secondary,
  }));

  // Dropdown styles - position: absolute, right: 0 ensures it opens to the left of the button
  const dropdownStyle = {
    position: 'absolute' as const,
    top: '100%',
    right: 0,
    marginTop: '8px',
    zIndex: 1400,
  };

  return (
    <AppBarStyled position="sticky" color="default">
      <ToolbarStyled>
        {/* Toggle Button */}
        <IconButton
          color="inherit"
          aria-label="menu"
          onClick={() => {
            if (lgUp) {
              setIsCollapse(isCollapse === 'full-sidebar' ? 'mini-sidebar' : 'full-sidebar');
            } else {
              setIsMobileSidebar(true);
            }
          }}
        >
          <IconMenu2 size={20} />
        </IconButton>

        <Box flexGrow={1} />

        <Stack spacing={1} direction="row" alignItems="center">
          {/* Theme Toggle */}
          <IconButton size="large" color="inherit" onClick={toggleTheme}>
            {activeMode === 'light' ? <IconMoon size={21} /> : <IconSun size={21} />}
          </IconButton>

          {/* Notifications - with position: relative container */}
          <Box ref={notificationRef} sx={{ position: 'relative' }}>
            <IconButton
              size="large"
              color="inherit"
              onClick={handleNotificationToggle}
            >
              <Badge badgeContent={notificationCount > 0 ? notificationCount : undefined} color="primary">
                <IconBell size={21} />
              </Badge>
            </IconButton>

            {notificationOpen && (
              <Paper
                elevation={8}
                sx={{
                  ...dropdownStyle,
                  width: 300,
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6">Bildirimler</Typography>
                </Box>
                <Divider />
                {isLoadingNotifications ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={20} />
                  </Box>
                ) : notifications.length > 0 ? (
                  <MenuList>
                    {notifications.slice(0, 5).map((notification) => (
                      <MuiMenuItem
                        key={notification.id}
                        onClick={() => setNotificationOpen(false)}
                      >
                        <Box>
                          <Typography variant="subtitle2">{notification.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString('tr-TR') : ''}
                          </Typography>
                        </Box>
                      </MuiMenuItem>
                    ))}
                  </MenuList>
                ) : (
                  <Box sx={{ py: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Bildirim bulunmuyor
                    </Typography>
                  </Box>
                )}
              </Paper>
            )}
          </Box>

          {/* Profile - with position: relative container */}
          <Box ref={profileRef} sx={{ position: 'relative' }}>
            <IconButton onClick={handleProfileToggle}>
              <Avatar
                src={user?.avatar}
                alt={user?.name || 'User'}
                sx={{ width: 35, height: 35 }}
              >
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>

            {profileOpen && (
              <Paper
                elevation={8}
                sx={{
                  ...dropdownStyle,
                  width: 220,
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {user?.name || 'Admin User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email || ''}
                  </Typography>
                </Box>
                <Divider />
                <MenuList>
                  <MuiMenuItem onClick={() => { setProfileOpen(false); navigate('/profile'); }}>
                    <IconUser size={18} style={{ marginRight: 8 }} />
                    Profil
                  </MuiMenuItem>
                  {isSuperAdmin && (
                    <MuiMenuItem onClick={() => { setProfileOpen(false); navigate('/settings'); }}>
                      <IconSettings size={18} style={{ marginRight: 8 }} />
                      Ayarlar
                    </MuiMenuItem>
                  )}
                </MenuList>
                <Divider />
                <MenuList>
                  <MuiMenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <IconLogout size={18} style={{ marginRight: 8 }} />
                    Çıkış Yap
                  </MuiMenuItem>
                </MenuList>
              </Paper>
            )}
          </Box>
        </Stack>
      </ToolbarStyled>
    </AppBarStyled>
  );
};

export default Header;
