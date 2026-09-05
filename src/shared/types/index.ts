/**
 * Shared Types
 * Common TypeScript types used across features.
 */

/** Standard API response envelope */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Toast notification type */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

/** Form field base */
export interface FormField {
  name: string;
  label: string;
  required?: boolean;
}

/** Async state */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}
