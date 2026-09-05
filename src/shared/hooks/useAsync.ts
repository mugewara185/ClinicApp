/**
 * Shared Hook — useAsync
 * Simple async state wrapper for non-API async operations.
 */

import { useState, useCallback } from 'react';

export const useAsync = <T, P = void>(
  asyncFn: (params?: P) => Promise<T>
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const run = useCallback(
    async (params?: P): Promise<T | undefined> => {
      setLoading(true);
      setError(null);
      try {
        const result = await asyncFn(params);
        setData(result);
        return result;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { loading, error, data, run, reset };
};
