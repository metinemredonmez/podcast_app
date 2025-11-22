import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
  Badge,
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

  const toggleTheme = () => {
    setActiveMode(activeMode === 'light' ? 'dark' : 'light');
  };

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = React.useState<null | HTMLElement>(null);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = async () => {
    handleProfileClose();
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

          {/* Notifications */}
          <IconButton size="large" color="inherit" onClick={handleNotificationClick}>
            <Badge badgeContent={3} color="primary">
              <IconBell size={21} />
            </Badge>
          </IconButton>

          {/* Notification Menu */}
          <Menu
            anchorEl={notificationAnchor}
            open={Boolean(notificationAnchor)}
            onClose={handleNotificationClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: { width: 320, maxHeight: 400 },
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="h6">Notifications</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleNotificationClose}>
              <Box>
                <Typography variant="subtitle2">New podcast uploaded</Typography>
                <Typography variant="caption" color="text.secondary">
                  5 minutes ago
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleNotificationClose}>
              <Box>
                <Typography variant="subtitle2">New user registered</Typography>
                <Typography variant="caption" color="text.secondary">
                  1 hour ago
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleNotificationClose}>
              <Box>
                <Typography variant="subtitle2">Episode approved</Typography>
                <Typography variant="caption" color="text.secondary">
                  2 hours ago
                </Typography>
              </Box>
            </MenuItem>
          </Menu>

          {/* Profile */}
          <IconButton onClick={handleProfileClick}>
            <Avatar
              src={user?.avatar}
              alt={user?.name || 'User'}
              sx={{ width: 35, height: 35 }}
            >
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>

          {/* Profile Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: { width: 200 },
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {user?.name || 'Admin User'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email || 'admin@podcast.app'}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { handleProfileClose(); navigate('/profile'); }}>
              <IconUser size={18} style={{ marginRight: 8 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={() => { handleProfileClose(); navigate('/settings'); }}>
              <IconSettings size={18} style={{ marginRight: 8 }} />
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <IconLogout size={18} style={{ marginRight: 8 }} />
              Logout
            </MenuItem>
          </Menu>
        </Stack>
      </ToolbarStyled>
    </AppBarStyled>
  );
};

export default Header;
