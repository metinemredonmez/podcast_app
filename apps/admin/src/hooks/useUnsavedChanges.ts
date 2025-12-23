import { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';

export interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean;
  onConfirm?: () => boolean | Promise<boolean>;
  message?: string;
}

/**
 * Hook to warn users about unsaved changes before leaving the page
 *
 * @param hasUnsavedChanges - Boolean indicating if there are unsaved changes
 * @param onConfirm - Optional callback when user confirms leaving (return false to cancel)
 * @param message - Custom warning message
 *
 * @example
 * const [formData, setFormData] = useState(initialData);
 * const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);
 *
 * useUnsavedChanges({
 *   hasUnsavedChanges: isDirty,
 *   message: 'You have unsaved changes. Are you sure you want to leave?'
 * });
 */
export function useUnsavedChanges({
  hasUnsavedChanges,
  onConfirm,
  message = 'You have unsaved changes. Are you sure you want to leave?',
}: UseUnsavedChangesOptions) {
  const navigate = useNavigate();
  const confirmedRef = useRef(false);

  // Block navigation within the app
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }: { currentLocation: { pathname: string }; nextLocation: { pathname: string } }) => {
        // Don't block if no unsaved changes
        if (!hasUnsavedChanges) return false;

        // Don't block if already confirmed
        if (confirmedRef.current) {
          confirmedRef.current = false;
          return false;
        }

        // Block if navigating to different route
        return currentLocation.pathname !== nextLocation.pathname;
      },
      [hasUnsavedChanges]
    )
  );

  // Handle blocked navigation
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmed = window.confirm(message);

      if (confirmed) {
        // Check if custom confirm handler allows leaving
        if (onConfirm) {
          Promise.resolve(onConfirm()).then((allowLeave) => {
            if (allowLeave !== false) {
              confirmedRef.current = true;
              blocker.proceed?.();
            } else {
              blocker.reset?.();
            }
          });
        } else {
          confirmedRef.current = true;
          blocker.proceed?.();
        }
      } else {
        blocker.reset?.();
      }
    }
  }, [blocker, message, onConfirm]);

  // Warn when closing/refreshing browser tab
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore custom messages and show their own
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message]);

  return {
    hasUnsavedChanges,
    blocker,
  };
}

/**
 * Simple hook to track form changes
 *
 * @param initialData - Initial form data
 * @param currentData - Current form data
 * @returns Boolean indicating if form has unsaved changes
 *
 * @example
 * const [formData, setFormData] = useState(initialData);
 * const isDirty = useFormDirty(initialData, formData);
 *
 * useUnsavedChanges({ hasUnsavedChanges: isDirty });
 */
export function useFormDirty<T>(initialData: T, currentData: T): boolean {
  return JSON.stringify(initialData) !== JSON.stringify(currentData);
}
