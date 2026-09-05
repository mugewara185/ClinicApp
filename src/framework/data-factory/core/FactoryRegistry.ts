/**
 * RDF FactoryRegistry
 * Central registry for all schema builders — stores generated data and provides
 * a unified create/stats/clear interface.
 * From FRAMEWORK_IMPLEMENTATION_GUIDE.md Phase 2, Step 2.2.
 */

import { FactoryBuilder } from './FactoryBuilder';
import type { SchemaDef, FactoryInput } from './types';

export class FactoryRegistry {
  private schemas: Map<string, SchemaDef> = new Map();
  private builders: Map<string, FactoryBuilder> = new Map();
  /** Track all generated records by schema name */
  private generatedData: Map<string, unknown[]> = new Map();

  // ---------------------------------------------------------------------------
  // Schema Registration
  // ---------------------------------------------------------------------------

  /**
   * Register a schema and return its builder for chaining.
   * @example
   *   factory.schema('doctor', { id: 'uuid', name: 'fullName' });
   */
  schema<T = Record<string, unknown>>(
    name: string,
    def: SchemaDef
  ): FactoryBuilder<T> {
    const builder = new FactoryBuilder<T>(name, def);
    this.schemas.set(name, def);
    this.builders.set(name, builder as unknown as FactoryBuilder);
    return builder;
  }

  // ---------------------------------------------------------------------------
  // Data Generation
  // ---------------------------------------------------------------------------

  /**
   * Generate data using a previously registered schema.
   * Stores generated records for stats tracking.
   */
  create<T = Record<string, unknown>>(name: string, options?: FactoryInput): T | T[] {
    const builder = this.builders.get(name) as FactoryBuilder<T> | undefined;
    if (!builder) {
      throw new Error(`[RDF DataFactory] Schema not found: "${name}". Did you register it?`);
    }

    const data = builder.create(options);
    const arr = Array.isArray(data) ? data : [data];
    const existing = (this.generatedData.get(name) ?? []) as T[];
    this.generatedData.set(name, [...existing, ...arr]);

    return data;
  }

  // ---------------------------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------------------------

  stats(): {
    schemas: number;
    totalRecords: number;
    bySchema: Record<string, number>;
  } {
    const bySchema: Record<string, number> = {};
    let totalRecords = 0;

    this.generatedData.forEach((records, schemaName) => {
      bySchema[schemaName] = records.length;
      totalRecords += records.length;
    });

    return {
      schemas: this.schemas.size,
      totalRecords,
      bySchema,
    };
  }

  // ---------------------------------------------------------------------------
  // Clear
  // ---------------------------------------------------------------------------

  /** Clear generated data (not schema definitions) */
  clear(name?: string): void {
    if (name) {
      this.generatedData.delete(name);
    } else {
      this.generatedData.clear();
    }
  }

  /** List all registered schema names */
  listSchemas(): string[] {
    return Array.from(this.schemas.keys());
  }
}
