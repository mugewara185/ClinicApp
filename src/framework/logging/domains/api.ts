/**
 * RDF Domain Logger — API
 * Provides structured helpers for logging API requests, responses, errors, and cache hits.
 * From FRAMEWORK_IMPLEMENTATION_GUIDE.md Phase 1, Step 1.2.
 */

import { logger } from '../core/Logger';

export const apiLogger = {
  /** Log outgoing API request */
  request: (method: string, endpoint: string, data?: unknown) => {
    logger.debug(
      `api:${method.toLowerCase()}:request`,
      `${method} ${endpoint}`,
      data,
      ['api', 'request']
    );
  },

  /** Log API response */
  response: (method: string, endpoint: string, status: number, data?: unknown) => {
    const level = status >= 400 ? 'warn' : 'info';
    logger[level](
      `api:${method.toLowerCase()}:response`,
      `${status} ${endpoint}`,
      data,
      ['api', 'response']
    );
  },

  /** Log API error */
  error: (endpoint: string, error: unknown) => {
    logger.error('api:error', `Failed: ${endpoint}`, error, ['api', 'error']);
  },

  /** Log cache hit */
  cached: (endpoint: string, ttl?: number) => {
    logger.info('api:cached', `Using cached response for ${endpoint}`, { ttl }, ['api', 'cache']);
  },
};
