/**
 * RDF Domain Logger — Component
 * Provides structured helpers for logging React component lifecycle events.
 * From FRAMEWORK_IMPLEMENTATION_GUIDE.md Phase 1, Step 1.2.
 */

import { logger } from '../core/Logger';

export const componentLogger = {
  /** Log component mount */
  mount: (name: string) => {
    logger.debug(`component:lifecycle:mount`, `${name} mounted`, undefined, ['component', 'lifecycle']);
  },

  /** Log component unmount */
  unmount: (name: string) => {
    logger.debug(`component:lifecycle:unmount`, `${name} unmounted`, undefined, ['component', 'lifecycle']);
  },

  /** Log component render with props summary */
  render: (name: string, props?: unknown) => {
    logger.debug(`component:lifecycle:render`, `${name} rendered`, props, ['component', 'render']);
  },

  /** Log a useEffect execution */
  effect: (componentName: string, effectName: string) => {
    logger.debug(`component:effect:${effectName}`, `${componentName} → ${effectName}`, undefined, ['component', 'effect']);
  },

  /** Log component-level errors */
  error: (name: string, error: unknown) => {
    logger.error(`component:error`, `Error in ${name}`, error, ['component', 'error']);
  },
};
