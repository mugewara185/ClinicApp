/**
 * RDF FeatureToggle
 * Register, enable, disable, and query boolean feature flags.
 * From FRAMEWORK_DESIGN.md §4.2.B.
 *
 * Usage:
 *   features.register('whatsappEnabled', true);
 *   if (features.isEnabled('whatsappEnabled')) { ... }
 *
 * Via window.__DEV__:
 *   window.__DEV__.features.toggle('whatsappEnabled');
 */

import { logger } from '../../logging/core/Logger';

export class FeatureToggle {
  private features: Map<string, boolean> = new Map();

  /** Register a feature with its default enabled state */
  register(name: string, defaultEnabled: boolean): void {
    this.features.set(name, defaultEnabled);
    logger.debug('dev:feature:register', `Registered "${name}" = ${defaultEnabled}`);
  }

  enable(name: string): void {
    this.features.set(name, true);
    logger.info('dev:feature:enable', `Feature "${name}" enabled`);
  }

  disable(name: string): void {
    this.features.set(name, false);
    logger.info('dev:feature:disable', `Feature "${name}" disabled`);
  }

  toggle(name: string): void {
    const current = this.features.get(name) ?? false;
    this.features.set(name, !current);
    logger.info('dev:feature:toggle', `Feature "${name}" toggled to ${!current}`);
  }

  isEnabled(name: string): boolean {
    console.log(`------>FeatureToggle: isEnabled('${name}') = ${this.features.get(name) ?? false}`);
    return this.features.get(name) ?? false;
  }

  getAll(): Record<string, boolean> {
    return Object.fromEntries(this.features.entries());
  }
}
