/**
 * RDF Shared — Response Utilities
 * Standardized response handling helpers.
 * From FRAMEWORK_IMPLEMENTATION_GUIDE.md Phase 3, Step 3.2.
 */

export interface ResponseShape<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  meta?: {
    timestamp: number;
    version: string;
  };
}

export const createResponse = <T = unknown>(
  data: T,
  options?: { error?: string; code?: string }
): ResponseShape<T> => ({
  success: !options?.error,
  data: options?.error ? undefined : data,
  error: options?.error
    ? { message: options.error, code: options.code }
    : undefined,
  meta: {
    timestamp: Date.now(),
    version: '1.0',
  },
});

export const createErrorResponse = (message: string, code?: string): ResponseShape<null> =>
  createResponse(null, { error: message, code });

export const isSuccessResponse = (response: ResponseShape): boolean =>
  response?.success === true;

export const getResponseData = <T = unknown>(response: ResponseShape<T>): T | null =>
  response.data ?? null;

export const getResponseError = (response: ResponseShape): string =>
  response.error?.message ?? 'Unknown error';
