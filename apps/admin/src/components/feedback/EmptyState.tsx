import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { IconMoodEmpty } from '@tabler/icons-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  illustration?: string;
  size?: 'small' | 'medium' | 'large';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  illustration,
  size = 'medium',
}) => {
  const iconSizes = {
    small: 48,
    medium: 64,
    large: 80,
  };

  const paddingY = {
    small: 4,
    medium: 6,
    large: 8,
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: paddingY[size],
        px: 3,
        textAlign: 'center',
      }}
    >
      {/* Illustration or Icon */}
      {illustration ? (
        <Box
          component="img"
          src={illustration}
          alt={title}
          sx={{
            width: '100%',
            maxWidth: iconSizes[size] * 3,
            height: 'auto',
            mb: 3,
            opacity: 0.8,
          }}
        />
      ) : (
        <Box
          sx={{
            width: iconSizes[size],
            height: iconSizes[size],
            borderRadius: '50%',
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          {icon || <IconMoodEmpty size={iconSizes[size] * 0.6} />}
        </Box>
      )}

      {/* Title */}
      <Typography
        variant={size === 'small' ? 'h6' : size === 'medium' ? 'h5' : 'h4'}
        fontWeight={600}
        gutterBottom
        color="text.primary"
      >
        {title}
      </Typography>

      {/* Description */}
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 400, mb: action || secondaryAction ? 3 : 0 }}
        >
          {description}
        </Typography>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <Stack direction="row" spacing={2} mt={2}>
          {action && (
            <Button
              variant="contained"
              startIcon={action.icon}
              onClick={action.onClick}
              size={size === 'small' ? 'small' : 'medium'}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outlined"
              onClick={secondaryAction.onClick}
              size={size === 'small' ? 'small' : 'medium'}
            >
              {secondaryAction.label}
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
};

// Predefined empty states for common scenarios
export const EmptyStates = {
  noPodcasts: (onCreateClick: () => void) => (
    <EmptyState
      title="No Podcasts Yet"
      description="Get started by creating your first podcast. Add episodes, manage content, and grow your audience."
      action={{
        label: 'Create Podcast',
        onClick: onCreateClick,
      }}
    />
  ),

  noEpisodes: (onCreateClick: () => void) => (
    <EmptyState
      title="No Episodes Yet"
      description="Start by uploading your first episode. Add audio files, descriptions, and metadata."
      action={{
        label: 'Add Episode',
        onClick: onCreateClick,
      }}
    />
  ),

  noResults: (onClearFilters?: () => void) => (
    <EmptyState
      title="No Results Found"
      description="We couldn't find anything matching your search. Try adjusting your filters or search terms."
      action={
        onClearFilters
          ? {
              label: 'Clear Filters',
              onClick: onClearFilters,
            }
          : undefined
      }
      size="small"
    />
  ),

  noData: () => (
    <EmptyState
      title="No Data Available"
      description="There is no data to display at the moment. Check back later."
      size="small"
    />
  ),

  noNotifications: () => (
    <EmptyState
      title="No Notifications"
      description="You're all caught up! No new notifications at this time."
      size="small"
    />
  ),

  noUsers: (onInviteClick: () => void) => (
    <EmptyState
      title="No Users Yet"
      description="Invite team members to collaborate on your podcasts."
      action={{
        label: 'Invite Users',
        onClick: onInviteClick,
      }}
    />
  ),

  error: (onRetry: () => void) => (
    <EmptyState
      title="Something Went Wrong"
      description="We couldn't load this content. Please try again."
      action={{
        label: 'Retry',
        onClick: onRetry,
      }}
      size="small"
    />
  ),

  noPermission: () => (
    <EmptyState
      title="Access Denied"
      description="You don't have permission to view this content. Contact your administrator if you think this is a mistake."
      size="small"
    />
  ),

  offline: () => (
    <EmptyState
      title="You're Offline"
      description="Please check your internet connection and try again."
      size="small"
    />
  ),
};
