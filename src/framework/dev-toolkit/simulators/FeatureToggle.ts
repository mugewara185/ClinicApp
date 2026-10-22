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
    if (name === 'whatsappEnabled' && this.features.get('mockBooking')) {
      this.features.set('mockBooking', false);
    } else if (name === 'mockBooking' && this.features.get('whatsappEnabled')) {
      this.features.set('whatsappEnabled', false);
    }
    logger.info('dev:feature:enable', `Feature "${name}" enabled`);
  }

  disable(name: string): void {
    this.features.set(name, false);
    logger.info('dev:feature:disable', `Feature "${name}" disabled`);
  }

  toggle(name: string): void {
    const current = this.features.get(name) ?? false;
    const next = !current;
    this.features.set(name, next);
    if (next && name === 'whatsappEnabled' && this.features.get('mockBooking')) {
      this.features.set('mockBooking', false);
    } else if (next && name === 'mockBooking' && this.features.get('whatsappEnabled')) {
      this.features.set('whatsappEnabled', false);
    }
    logger.info('dev:feature:toggle', `Feature "${name}" toggled to ${next}`);
  }

  isEnabled(name: string): boolean {
    return this.features.get(name) ?? false;
  }

  getAll(): Record<string, boolean> {
    return Object.fromEntries(this.features.entries());
  }
}
