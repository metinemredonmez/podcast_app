import React from 'react';
import { Card, CardContent, Typography, Stack, Avatar, Box, useTheme } from '@mui/material';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  suffix?: string;
  loading?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  icon,
  color,
  suffix = '',
  loading = false,
}) => {
  const theme = useTheme();
  const hasChange = typeof change === 'number';
  const isPositive = hasChange && change >= 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={600} mb={1}>
              {typeof value === 'number' ? value.toLocaleString() : value}
              {suffix && (
                <Typography component="span" variant="h6" color="text.secondary" ml={0.5}>
                  {suffix}
                </Typography>
              )}
            </Typography>
            {hasChange && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {isPositive ? (
                  <IconTrendingUp size={16} color={theme.palette.success.main} />
                ) : (
                  <IconTrendingDown size={16} color={theme.palette.error.main} />
                )}
                <Typography
                  variant="caption"
                  color={isPositive ? 'success.main' : 'error.main'}
                  fontWeight={600}
                >
                  {isPositive ? '+' : ''}
                  {change}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  vs previous period
                </Typography>
              </Stack>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>{icon}</Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
};
