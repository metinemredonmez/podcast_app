import React, { useContext } from 'react';
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
} from '@tabler/icons-react';
import { CustomizerContext } from '../../context/customizerContext';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';

interface MenuItem {
  id: string;
  title: string;
  icon: React.ElementType;
  href: string;
  navlabel?: boolean;
  subheader?: string;
}

const menuItems: MenuItem[] = [
  { id: 'nav-dashboard', title: 'Dashboard', subheader: 'Dashboard', navlabel: true, icon: IconLayoutDashboard, href: '' },
  { id: 'dashboard', title: 'Dashboard', icon: IconLayoutDashboard, href: '/dashboard' },
  { id: 'analytics', title: 'Analytics', icon: IconChartBar, href: '/analytics' },

  { id: 'nav-content', title: 'Content', subheader: 'Content Management', navlabel: true, icon: IconMicrophone, href: '' },
  { id: 'podcasts', title: 'Podcasts', icon: IconMicrophone, href: '/podcasts' },
  { id: 'episodes', title: 'Episodes', icon: IconHeadphones, href: '/episodes' },
  { id: 'categories', title: 'Categories', icon: IconCategory, href: '/categories' },

  { id: 'nav-users', title: 'Users', subheader: 'User Management', navlabel: true, icon: IconUsers, href: '' },
  { id: 'users', title: 'Users', icon: IconUsers, href: '/users' },
  { id: 'hocas', title: 'Hocas', icon: IconUser, href: '/hocas' },
  { id: 'comments', title: 'Comments', icon: IconMessage, href: '/comments' },
  { id: 'reviews', title: 'Reviews', icon: IconStar, href: '/reviews' },
];

const Sidebar: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const lgUp = useMediaQuery(theme.breakpoints.up('lg'));
  const { isCollapse, isMobileSidebar, setIsMobileSidebar } = useContext(CustomizerContext);

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

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ px: 3, py: 2.5 }}>
        <Typography variant="h5" fontWeight={600} color="primary">
          Podcast Admin
        </Typography>
      </Box>

      <Divider />

      {/* Menu Items */}
      <SimpleBar style={{ maxHeight: 'calc(100vh - 120px)' }}>
        <List sx={{ px: 2, pt: 1 }}>
          {menuItems.map((item) => {
            if (item.navlabel) {
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

            const isSelected = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.href)}
                  sx={{
                    borderRadius: '8px',
                    mb: 0.5,
                    backgroundColor: isSelected ? theme.palette.primary.light : 'transparent',
                    color: isSelected ? theme.palette.primary.main : theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: isSelected
                        ? theme.palette.primary.light
                        : theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isSelected ? theme.palette.primary.main : theme.palette.text.secondary,
                    }}
                  >
                    <Icon size={20} />
                  </ListItemIcon>
                  {isSidebarOpen && <ListItemText primary={item.title} />}
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
