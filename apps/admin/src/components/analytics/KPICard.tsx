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
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>{icon}</Avatar>
        </Stack>
        <Box mt={2}>
          <Typography variant="h4" fontWeight={600}>
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && (
              <Typography component="span" variant="h6" color="text.secondary" ml={0.5}>
                {suffix}
              </Typography>
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {title}
          </Typography>
          {hasChange && (
            <Stack direction="row" alignItems="center" spacing={0.5} mt={1}>
              {isPositive ? (
                <IconTrendingUp size={14} color={theme.palette.success.main} />
              ) : (
                <IconTrendingDown size={14} color={theme.palette.error.main} />
              )}
              <Typography
                variant="caption"
                color={isPositive ? 'success.main' : 'error.main'}
                fontWeight={600}
              >
                {isPositive ? '+' : ''}
                {change}%
              </Typography>
            </Stack>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
