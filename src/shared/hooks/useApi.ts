/**
 * RDF Shared Hook — useApi
 * Generic data-fetching hook with retry, auto-fetch, and logging.
 * From FRAMEWORK_IMPLEMENTATION_GUIDE.md Phase 3, Step 3.1.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiLogger } from '../../framework/logging/domains/api';

interface UseApiOptions<T> {
  /** Trigger fetch on mount */
  autoFetch?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  /** Number of retries on failure */
  retry?: number;
}

export const useApi = <T, P = void>(
  apiFunction: (params?: P) => Promise<T>,
  options?: UseApiOptions<T>
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Prevent state update after unmount
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(
    async (params?: P): Promise<T | undefined> => {
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }

      let retries = options?.retry ?? 0;

      while (retries >= 0) {
        try {
          const result = await apiFunction(params);

          if (mountedRef.current) {
            setData(result);
            apiLogger.response('GET', 'api', 200, typeof result === 'object' && result !== null ? { received: true } : result);
            options?.onSuccess?.(result);
          }

          return result;
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));

          if (retries > 0) {
            retries--;
            await new Promise(r => setTimeout(r, 1000 * (options?.retry ?? 1 - retries)));
            continue;
          }

          if (mountedRef.current) {
            setError(error);
            apiLogger.error('api', error);
            options?.onError?.(error);
          }

          break;
        } finally {
          if (mountedRef.current) setLoading(false);
        }
        break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiFunction]
  );

  useEffect(() => {
    if (options?.autoFetch) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    isError: error !== null,
    isDone: !loading && data !== null,
    refetch: execute,
  };
};
