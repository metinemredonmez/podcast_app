import { Box, CircularProgress, Typography, Fade } from '@mui/material';

interface PageLoaderProps {
  message?: string;
}

/**
 * Full page loader for lazy-loaded components
 */
export const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading...' }) => {
  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: 2,
        }}
      >
        <CircularProgress size={40} thickness={4} />
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Box>
    </Fade>
  );
};

/**
 * Skeleton loader for table pages
 */
export const TablePageLoader: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box sx={{ width: 200, height: 32, bgcolor: 'grey.200', borderRadius: 1 }} />
        <Box sx={{ width: 120, height: 36, bgcolor: 'grey.200', borderRadius: 1 }} />
      </Box>
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
        {[...Array(5)].map((_, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ width: 40, height: 40, bgcolor: 'grey.200', borderRadius: '50%' }} />
            <Box sx={{ flex: 1 }}>
              <Box sx={{ width: '60%', height: 16, bgcolor: 'grey.200', borderRadius: 1, mb: 1 }} />
              <Box sx={{ width: '40%', height: 12, bgcolor: 'grey.100', borderRadius: 1 }} />
            </Box>
            <Box sx={{ width: 80, height: 24, bgcolor: 'grey.200', borderRadius: 1 }} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PageLoader;
