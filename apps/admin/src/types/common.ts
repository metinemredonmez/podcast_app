/**
 * Common utility types
 */

import { AxiosError } from 'axios';

// Error handling types
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}

export type ApiAxiosError = AxiosError<ApiErrorResponse>;

/**
 * Type guard to check if error is an Axios error with our API response format
 */
export function isApiError(error: unknown): error is ApiAxiosError {
  return (
    error instanceof Error &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}

/**
 * Extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.response?.data?.message || error.message || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

// Form related types
export interface FormFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
}

// Event handler types
export type InputChangeHandler = React.ChangeEvent<HTMLInputElement>;
export type SelectChangeHandler = React.ChangeEvent<{ value: unknown }>;
export type FormSubmitHandler = React.FormEvent<HTMLFormElement>;

// Filter value type - more specific than any
export type FilterValue = string | number | boolean | string[] | { from: string; to: string } | null | undefined;

export interface FilterValues {
  [key: string]: FilterValue;
}

// Sort configuration
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// Table column definition
export interface TableColumn<T> {
  id: keyof T | string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

// Menu item type
export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

// Dialog props
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
}

// Loading state
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Async operation state
export interface AsyncState<T> extends LoadingState {
  data: T | null;
}

// Component with children
export interface WithChildren {
  children: React.ReactNode;
}

// Optional className prop
export interface WithClassName {
  className?: string;
}

// Style props
export interface WithStyle {
  style?: React.CSSProperties;
}

// Common component props
export type CommonProps = WithChildren & WithClassName & WithStyle;
