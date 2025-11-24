import React from 'react';
import { Box, Skeleton, Stack, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

export interface LoadingSkeletonProps {
  variant?: 'table' | 'card' | 'form' | 'list' | 'detail';
  rows?: number;
  height?: number | string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'card',
  rows = 5,
  height,
}) => {
  switch (variant) {
    case 'table':
      return <TableSkeleton rows={rows} />;
    case 'card':
      return <CardSkeleton height={height} />;
    case 'form':
      return <FormSkeleton />;
    case 'list':
      return <ListSkeleton rows={rows} />;
    case 'detail':
      return <DetailSkeleton />;
    default:
      return <CardSkeleton height={height} />;
  }
};

// Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <Table>
      <TableHead>
        <TableRow>
          {[1, 2, 3, 4, 5].map((col) => (
            <TableCell key={col}>
              <Skeleton variant="text" width="80%" />
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {[1, 2, 3, 4, 5].map((col) => (
              <TableCell key={col}>
                {col === 1 ? (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                  </Stack>
                ) : (
                  <Skeleton variant="text" width="70%" />
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// Card Skeleton
export const CardSkeleton: React.FC<{ height?: number | string }> = ({ height = 200 }) => {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="rectangular" width="100%" height={height} />
          <Stack direction="row" spacing={1}>
            <Skeleton variant="rectangular" width={100} height={36} />
            <Skeleton variant="rectangular" width={100} height={36} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Form Skeleton
export const FormSkeleton: React.FC = () => {
  return (
    <Stack spacing={3}>
      {/* Title */}
      <Box>
        <Skeleton variant="text" width={100} height={20} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={40} />
      </Box>

      {/* Description */}
      <Box>
        <Skeleton variant="text" width={120} height={20} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={100} />
      </Box>

      {/* Two column fields */}
      <Stack direction="row" spacing={2}>
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width={80} height={20} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={40} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width={80} height={20} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={40} />
        </Box>
      </Stack>

      {/* Select field */}
      <Box>
        <Skeleton variant="text" width={100} height={20} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={40} />
      </Box>

      {/* Image upload */}
      <Box>
        <Skeleton variant="text" width={120} height={20} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={200} />
      </Box>

      {/* Action buttons */}
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Skeleton variant="rectangular" width={100} height={36} />
        <Skeleton variant="rectangular" width={100} height={36} />
      </Stack>
    </Stack>
  );
};

// List Skeleton
export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <Stack spacing={2}>
      {Array.from({ length: rows }).map((_, index) => (
        <Card key={index}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Skeleton variant="circular" width={48} height={48} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="70%" height={24} />
                <Skeleton variant="text" width="40%" height={20} />
              </Box>
              <Skeleton variant="rectangular" width={80} height={32} />
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

// Detail Page Skeleton
export const DetailSkeleton: React.FC = () => {
  return (
    <Stack spacing={3}>
      {/* Header */}
      <Card>
        <CardContent>
          <Stack direction="row" spacing={3} alignItems="center">
            <Skeleton variant="rectangular" width={120} height={120} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="50%" height={36} />
              <Skeleton variant="text" width="30%" height={24} sx={{ mt: 1 }} />
              <Stack direction="row" spacing={2} mt={2}>
                <Skeleton variant="rectangular" width={100} height={32} />
                <Skeleton variant="rectangular" width={100} height={32} />
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Stack direction="row" spacing={2}>
        {[1, 2, 3, 4].map((stat) => (
          <Card key={stat} sx={{ flex: 1 }}>
            <CardContent>
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="text" width="40%" height={32} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Content Sections */}
      <Card>
        <CardContent>
          <Skeleton variant="text" width="30%" height={28} sx={{ mb: 2 }} />
          <Stack spacing={2}>
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

// Chart Skeleton
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={height} />
        <Stack direction="row" spacing={2} mt={2} justifyContent="center">
          <Skeleton variant="rectangular" width={80} height={20} />
          <Skeleton variant="rectangular" width={80} height={20} />
          <Skeleton variant="rectangular" width={80} height={20} />
        </Stack>
      </CardContent>
    </Card>
  );
};

// Grid Skeleton (for card grids)
export const GridSkeleton: React.FC<{ items?: number; columns?: number }> = ({
  items = 6,
  columns = 3,
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 2,
      }}
    >
      {Array.from({ length: items }).map((_, index) => (
        <Card key={index}>
          <Skeleton variant="rectangular" width="100%" height={180} />
          <CardContent>
            <Skeleton variant="text" width="80%" height={24} />
            <Skeleton variant="text" width="60%" height={20} sx={{ mt: 1 }} />
            <Stack direction="row" spacing={1} mt={2}>
              <Skeleton variant="rectangular" width={60} height={24} />
              <Skeleton variant="rectangular" width={60} height={24} />
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};
