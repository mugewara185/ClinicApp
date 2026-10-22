/**
 * RDF Framework Initialization
 * Bootstraps all framework singletons and attaches window.__DEV__ in dev mode.
 *
 * Import this ONCE at the top of main.tsx before mounting React.
 *
 * From FRAMEWORK_QUICK_REFERENCE.md §Quick Start and FRAMEWORK_DESIGN.md §4.2.D.
 *
 * window.__DEV__ usage (browser console):
 *   window.__DEV__.logger.getLogs({ level: 'ERROR' })
 *   window.__DEV__.api.setDelay('booking', 2000)
 *   window.__DEV__.features.toggle('whatsappEnabled')
 *   window.__DEV__.factory.create('testimonial', { count: 3 })
 *   window.__DEV__.resetAll()
 */

import { Logger } from './logging/core/Logger';
import { FactoryRegistry } from './data-factory/core/FactoryRegistry';
import { ApiSimulator } from './dev-toolkit/simulators/ApiSimulator';
import { FeatureToggle } from './dev-toolkit/simulators/FeatureToggle';

// Import schema definitions
import { doctorSchemaDef } from './schemas/doctor';
import { serviceSchemaDef } from './schemas/service';
import { testimonialSchemaDef } from './schemas/testimonial';

// ---------------------------------------------------------------------------
// 1. Instantiate framework singletons
// ---------------------------------------------------------------------------

export const logger = new Logger({
  minLevel: import.meta.env.DEV ? 'DEBUG' : 'WARN',
  persistLogs: true,
  maxLogs: 500,
});

export const factory = new FactoryRegistry();

export const apiSimulator = new ApiSimulator();

export const features = new FeatureToggle();

// ---------------------------------------------------------------------------
// 2. Register schemas with the factory
// ---------------------------------------------------------------------------

factory.schema('doctor',      doctorSchemaDef);
factory.schema('service',     serviceSchemaDef);
factory.schema('testimonial', testimonialSchemaDef);

// ---------------------------------------------------------------------------
// 3. Register feature flags
// ---------------------------------------------------------------------------

export interface BookingFeatureEnv {
  DEV?: boolean;
  PROD?: boolean;
  VITE_WHATSAPP_ENABLED?: string;
  VITE_MOCK_BOOKING?: string;
}

/**
 * Resolves initial feature flags deterministically:
 * - If MOCK_BOOKING / VITE_MOCK_BOOKING is explicitly 'true', mock mode is enabled and real WhatsApp is disabled.
 * - Otherwise, if WHATSAPP_ENABLED / VITE_WHATSAPP_ENABLED is 'true', real WhatsApp is enabled and mockBooking is false (even in DEV).
 * - Otherwise, mockBooking defaults to true in DEV and false in PROD.
 */
export const resolveBookingFeatureFlags = (
  env: BookingFeatureEnv
): { whatsappEnabled: boolean; mockBooking: boolean } => {
  const explicitWhatsapp = env.VITE_WHATSAPP_ENABLED === 'true';
  const explicitMockTrue = env.VITE_MOCK_BOOKING === 'true';
  const explicitMockFalse = env.VITE_MOCK_BOOKING === 'false';

  const whatsappEnabled = explicitWhatsapp && !explicitMockTrue;
  const mockBooking = explicitMockTrue
    ? true
    : explicitMockFalse
      ? false
      : Boolean(env.DEV) && !explicitWhatsapp;

  return { whatsappEnabled, mockBooking };
};

const rawEnv = (import.meta.env ?? {}) as BookingFeatureEnv;
const initialFlags = resolveBookingFeatureFlags(rawEnv);

features.register('whatsappEnabled', initialFlags.whatsappEnabled);
features.register('showDevPanel',    Boolean(rawEnv.DEV));
features.register('mockBooking',     initialFlags.mockBooking);

// ---------------------------------------------------------------------------
// 4. Expose window.__DEV__ in development
// ---------------------------------------------------------------------------

if (rawEnv.DEV && typeof window !== 'undefined') {
  (window as unknown as { __DEV__: unknown }).__DEV__ = {
    logger,
    factory,
    api: apiSimulator,
    features,

    // Quick-access commands (from FRAMEWORK_DESIGN.md §4.2.D)
    simulateSlowApi: () => apiSimulator.setRandomDelay('*', 1000, 3000),
    simulateErrors:  () => apiSimulator.setRandomError('*', 0.5),
    resetAll: () => {
      apiSimulator.reset();
      logger.clear();
      logger.info('dev:reset', 'All dev tools reset');
    },
  };

  logger.info('framework:init', '🚀 RDF Framework initialized', {
    mode: 'development',
    schemas: factory.listSchemas(),
    features: features.getAll(),
  });
} else {
  logger.info('framework:init', '🚀 RDF Framework initialized (production mode)');
}

