/**
 * RDF DataFactory Types
 * Core TypeScript interfaces for the schema-driven data generation system.
 * Based on FRAMEWORK_DESIGN.md §2.1 and FRAMEWORK_IMPLEMENTATION_GUIDE.md Phase 2.
 */

import type { Faker } from '@faker-js/faker';

/** Context passed to every custom generator function */
export interface GeneratorContext {
  /** 0-based index of the record being generated */
  index: number;
  seed: number;
  faker: Faker;
}

/** Full field definition */
export interface FieldDef {
  type?: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  /** Named generator key ('email', 'uuid') or a custom function */
  generator?: string | ((ctx: GeneratorContext) => unknown);
  options?: {
    min?: number;
    max?: number;
    /** Rotates through enum values */
    enum?: unknown[];
    format?: string;
    nullable?: boolean;
    default?: unknown;
  };
  transform?: (val: unknown) => unknown;
}

/** Schema is a map of field names → FieldDef or shorthand string */
export interface SchemaDef {
  [key: string]: FieldDef | string;
}

/** Options when calling factory.create() */
export interface FactoryInput {
  /** Number of records to generate (default: 1) */
  count?: number;
  /** Override specific fields by index or globally */
  overrides?: Record<number | string, Partial<Record<string, unknown>>>;
  seed?: number;
}
