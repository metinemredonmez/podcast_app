import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { IconStar } from '@tabler/icons-react';

const ReviewsPage: React.FC = () => {
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconStar size={28} />
        <Typography variant="h4">Reviews</Typography>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <IconStar size={64} style={{ opacity: 0.3, marginBottom: 16 }} />
            <Typography variant="h5" gutterBottom>
              Reviews Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This page is under development. Reviews and ratings management features will be available soon.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReviewsPage;
