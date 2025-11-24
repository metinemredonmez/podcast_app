import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  Snackbar,
  Alert,
  AlertColor,
  Button,
  IconButton,
  Slide,
  SlideProps,
} from '@mui/material';
import { IconX } from '@tabler/icons-react';

interface ToastOptions {
  message: string;
  severity?: AlertColor;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

interface Toast extends ToastOptions {
  id: string;
  open: boolean;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  showSuccess: (message: string, action?: ToastOptions['action']) => void;
  showError: (message: string, action?: ToastOptions['action']) => void;
  showWarning: (message: string, action?: ToastOptions['action']) => void;
  showInfo: (message: string, action?: ToastOptions['action']) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      open: true,
      severity: 'info',
      duration: 6000,
      position: { vertical: 'bottom', horizontal: 'right' },
      ...options,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-hide toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.map((toast) => (toast.id === id ? { ...toast, open: false } : toast)));

    // Remove from array after animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 300);
  }, []);

  const showSuccess = useCallback(
    (message: string, action?: ToastOptions['action']) => {
      showToast({ message, severity: 'success', action });
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, action?: ToastOptions['action']) => {
      showToast({ message, severity: 'error', duration: 8000, action });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, action?: ToastOptions['action']) => {
      showToast({ message, severity: 'warning', action });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, action?: ToastOptions['action']) => {
      showToast({ message, severity: 'info', action });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        hideToast,
      }}
    >
      {children}

      {/* Render all toasts */}
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open={toast.open}
          anchorOrigin={toast.position}
          TransitionComponent={SlideTransition}
          sx={{
            // Stack toasts vertically
            bottom: toast.position?.vertical === 'bottom' ? `${24 + index * 70}px !important` : undefined,
            top: toast.position?.vertical === 'top' ? `${24 + index * 70}px !important` : undefined,
          }}
        >
          <Alert
            severity={toast.severity}
            variant="filled"
            onClose={() => hideToast(toast.id)}
            action={
              <>
                {toast.action && (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      toast.action?.onClick();
                      hideToast(toast.id);
                    }}
                    sx={{ mr: 1 }}
                  >
                    {toast.action.label}
                  </Button>
                )}
                <IconButton
                  size="small"
                  aria-label="close"
                  color="inherit"
                  onClick={() => hideToast(toast.id)}
                >
                  <IconX size={18} />
                </IconButton>
              </>
            }
            sx={{
              minWidth: 300,
              maxWidth: 500,
              boxShadow: 3,
            }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Convenience component for imperative usage
export const toast = {
  success: (message: string, action?: ToastOptions['action']) => {
    // This will be implemented via a singleton pattern or event system
    window.dispatchEvent(
      new CustomEvent('toast', { detail: { message, severity: 'success', action } })
    );
  },
  error: (message: string, action?: ToastOptions['action']) => {
    window.dispatchEvent(new CustomEvent('toast', { detail: { message, severity: 'error', action } }));
  },
  warning: (message: string, action?: ToastOptions['action']) => {
    window.dispatchEvent(
      new CustomEvent('toast', { detail: { message, severity: 'warning', action } })
    );
  },
  info: (message: string, action?: ToastOptions['action']) => {
    window.dispatchEvent(new CustomEvent('toast', { detail: { message, severity: 'info', action } }));
  },
};
