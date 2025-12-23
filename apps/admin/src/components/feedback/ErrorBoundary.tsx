import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Typography, Paper, Stack } from '@mui/material';
import { IconAlertTriangle, IconRefresh, IconBug } from '@tabler/icons-react';
import { logger } from '../../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // TODO: Send error to logging service (e.g., Sentry)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReport = () => {
    const { error, errorInfo } = this.state;
    const errorReport = {
      error: error?.toString(),
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    logger.info('Error Report:', errorReport);
    // TODO: Send to backend error reporting endpoint
    alert('Error report has been logged. Please contact support if the issue persists.');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            p: 3,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              maxWidth: 600,
              width: '100%',
              p: 4,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'error.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <IconAlertTriangle size={40} color="#d32f2f" />
            </Box>

            <Typography variant="h4" fontWeight={600} gutterBottom>
              Something Went Wrong
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
              We're sorry, but something unexpected happened. The error has been logged and we'll
              look into it.
            </Typography>

            {/* Error details (only in development) */}
            {import.meta.env.DEV && this.state.error && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mt: 3,
                  mb: 3,
                  textAlign: 'left',
                  bgcolor: 'grey.50',
                  maxHeight: 200,
                  overflow: 'auto',
                }}
              >
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.error.stack}
                </Typography>
              </Paper>
            )}

            <Stack direction="row" spacing={2} justifyContent="center" mt={3}>
              <Button
                variant="outlined"
                startIcon={<IconRefresh size={18} />}
                onClick={this.handleReset}
              >
                Try Again
              </Button>
              <Button variant="outlined" onClick={this.handleReload}>
                Reload Page
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<IconBug size={18} />}
                onClick={this.handleReport}
              >
                Report Issue
              </Button>
            </Stack>

            <Typography variant="caption" color="text.secondary" display="block" mt={3}>
              If the problem persists, please contact support with the error details above.
            </Typography>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
