/**
 * RDF DataFactory Hook
 * React hook that provides factory instance and creates typed data from registered schemas.
 * From FRAMEWORK_IMPLEMENTATION_GUIDE.md Phase 2, Step 2.3.
 */

import { useState, useCallback } from 'react';
import type { FactoryRegistry } from '../core/FactoryRegistry';
import type { FactoryInput } from '../core/types';

export const useFactory = <T = Record<string, unknown>>(
  registry: FactoryRegistry,
  schemaName?: string
) => {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const create = useCallback(
    (input: FactoryInput = {}) => {
      if (!schemaName) return;
      setIsLoading(true);
      try {
        const result = registry.create<T>(schemaName, input);
        const arr = Array.isArray(result) ? result : [result];
        setData(arr);
        return arr;
      } finally {
        setIsLoading(false);
      }
    },
    [registry, schemaName]
  );

  const regenerate = useCallback(() => {
    create({ count: data.length });
  }, [create, data.length]);

  return {
    data,
    isLoading,
    create,
    regenerate,
    stats: () => registry.stats(),
  };
};
