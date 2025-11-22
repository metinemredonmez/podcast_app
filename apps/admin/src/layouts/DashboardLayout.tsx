import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, useTheme, useMediaQuery } from '@mui/material';
import { styled } from '@mui/material/styles';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { CustomizerContext } from '../context/customizerContext';

const MainWrapper = styled('div')(() => ({
  display: 'flex',
  minHeight: '100vh',
  width: '100%',
}));

const PageWrapper = styled('div')(() => ({
  display: 'flex',
  flexGrow: 1,
  paddingBottom: '60px',
  flexDirection: 'column',
  zIndex: 1,
  width: '100%',
  backgroundColor: 'transparent',
}));

export const DashboardLayout: React.FC = () => {
  const theme = useTheme();
  const lgUp = useMediaQuery(theme.breakpoints.up('lg'));
  const { isCollapse, activeMode } = useContext(CustomizerContext);
  const isSidebarOpen = isCollapse !== 'mini-sidebar';
  const miniSidebarWidth = 87;

  return (
    <MainWrapper className={activeMode === 'dark' ? 'darkbg' : ''}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Wrapper */}
      <PageWrapper
        sx={{
          ...(!isSidebarOpen &&
            lgUp && {
              ml: `${miniSidebarWidth}px`,
            }),
        }}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <Container
          maxWidth={false}
          sx={{
            pt: '30px',
            px: { xs: 2, sm: 3 },
          }}
        >
          <Box sx={{ minHeight: 'calc(100vh - 170px)' }}>
            <Outlet />
          </Box>
        </Container>
      </PageWrapper>
    </MainWrapper>
  );
};

export default DashboardLayout;
