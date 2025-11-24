import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { IconMessage } from '@tabler/icons-react';

const CommentsPage: React.FC = () => {
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconMessage size={28} />
        <Typography variant="h4">Comments</Typography>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <IconMessage size={64} style={{ opacity: 0.3, marginBottom: 16 }} />
            <Typography variant="h5" gutterBottom>
              Comments Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This page is under development. Comments management features will be available soon.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CommentsPage;
