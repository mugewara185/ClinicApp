/**
 * RDF ApiSimulator
 * Simulates network delays and errors for development testing.
 * From FRAMEWORK_IMPLEMENTATION_GUIDE.md Phase 4, Step 4.1.
 *
 * Usage via window.__DEV__:
 *   window.__DEV__.api.setDelay('booking', 2000);
 *   window.__DEV__.api.setError('booking', 500, 'Server error');
 *   window.__DEV__.api.setRandomDelay('*', 500, 2000);
 */

import { logger } from '../../logging/core/Logger';

export class ApiSimulator {
  /** endpoint → [minMs, maxMs] */
  private delays: Map<string, [number, number]> = new Map();
  /** endpoint → { status, message } */
  private errors: Map<string, { status: number; message: string }> = new Map();
  /** endpoint → probability 0–1 */
  private errorProbabilities: Map<string, number> = new Map();
  private enabled = true;

  // ---------------------------------------------------------------------------
  // Delay Simulation
  // ---------------------------------------------------------------------------

  setDelay(endpoint: string, delayMs: number): void {
    this.delays.set(endpoint, [delayMs, delayMs]);
    logger.info('dev:api:delay', `Set ${delayMs}ms delay for "${endpoint}"`);
  }

  setRandomDelay(endpoint: string, minMs: number, maxMs: number): void {
    this.delays.set(endpoint, [minMs, maxMs]);
    logger.info('dev:api:randomDelay', `Set ${minMs}–${maxMs}ms delay for "${endpoint}"`);
  }

  // ---------------------------------------------------------------------------
  // Error Simulation
  // ---------------------------------------------------------------------------

  setError(endpoint: string, status: number, message: string): void {
    this.errors.set(endpoint, { status, message });
    logger.warn('dev:api:error', `Set ${status} error for "${endpoint}"`);
  }

  setRandomError(endpoint: string, probability: number): void {
    this.errorProbabilities.set(endpoint, probability);
    logger.warn('dev:api:randomError', `${(probability * 100).toFixed(0)}% error for "${endpoint}"`);
  }

  clearError(endpoint: string): void {
    this.errors.delete(endpoint);
    this.errorProbabilities.delete(endpoint);
    logger.info('dev:api:clearError', `Cleared error for "${endpoint}"`);
  }

  // ---------------------------------------------------------------------------
  // Core simulation wrapper
  // ---------------------------------------------------------------------------

  /**
   * Wrap any async call with simulation behavior.
   * @example
   *   const result = await api.simulateFetch('booking', () => realApiCall());
   */
  async simulateFetch<T>(endpoint: string, realFetch: () => Promise<T>): Promise<T> {
    if (!this.enabled) return realFetch();

    // Check wildcard error
    const wildcard = this.errors.get('*');
    const specificError = this.errors.get(endpoint);
    const error = specificError ?? wildcard;
    if (error) {
      logger.error('dev:api:simulatedError', `Simulating ${error.status} for "${endpoint}"`);
      throw new Error(`[Simulated ${error.status}] ${error.message}`);
    }

    // Check random error probability
    const prob = this.errorProbabilities.get(endpoint) ?? this.errorProbabilities.get('*');
    if (prob !== undefined && Math.random() < prob) {
      logger.error('dev:api:randomError', `Random error triggered for "${endpoint}"`);
      throw new Error(`[Simulated Random Error] ${endpoint}`);
    }

    // Apply delay
    const delay = this.delays.get(endpoint) ?? this.delays.get('*');
    if (delay) {
      const [min, max] = delay;
      const wait = min + Math.random() * (max - min);
      logger.debug('dev:api:delay', `Delaying "${endpoint}" by ${wait.toFixed(0)}ms`);
      await new Promise(resolve => setTimeout(resolve, wait));
    }

    return realFetch();
  }

  enable(): void {
    this.enabled = true;
    logger.info('dev:api:enabled', 'API simulator enabled');
  }

  disable(): void {
    this.enabled = false;
    logger.info('dev:api:disabled', 'API simulator disabled');
  }

  reset(): void {
    this.delays.clear();
    this.errors.clear();
    this.errorProbabilities.clear();
    this.enabled = true;
    logger.info('dev:api:reset', 'API simulator reset to defaults');
  }
}
