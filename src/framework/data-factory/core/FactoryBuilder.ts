/**
 * RDF FactoryBuilder
 * Generates typed mock data from schema definitions.
 * From FRAMEWORK_IMPLEMENTATION_GUIDE.md Phase 2, Step 2.1.
 *
 * Supports:
 *  - Shorthand string generators: 'uuid', 'email', 'fullName', etc.
 *  - Custom generator functions: (ctx) => value
 *  - Enum rotation
 *  - Field transforms
 *  - Deterministic seeding
 */

import { faker } from '@faker-js/faker';
import type { SchemaDef, FieldDef, GeneratorContext, FactoryInput } from './types';

export class FactoryBuilder<T = Record<string, unknown>> {
  private normalizedSchema: SchemaDef;

  constructor(
    private readonly name: string,
    schema: SchemaDef
  ) {
    this.normalizedSchema = this.normalizeSchema(schema);
  }

  // ---------------------------------------------------------------------------
  // Schema normalization
  // ---------------------------------------------------------------------------

  /**
   * Converts shorthand string field definitions to full FieldDef objects.
   * e.g. 'email' → { type: 'string', generator: () => faker.internet.email() }
   */
  private normalizeSchema(schema: SchemaDef): SchemaDef {
    const normalized: SchemaDef = {};
    Object.entries(schema).forEach(([key, value]) => {
      normalized[key] = typeof value === 'string'
        ? this.resolveGenerator(value)
        : (value as FieldDef);
    });
    return normalized;
  }

  /**
   * Resolve a named generator string to a FieldDef with a generator function.
   */
  private resolveGenerator(gen: string): FieldDef {
    const generators: Record<string, () => unknown> = {
      // Identifiers
      'uuid':        () => faker.string.uuid(),
      'id':          () => faker.string.alphanumeric(8),
      'slug':        () => faker.lorem.slug(2),

      // Primitives
      'string':      () => faker.string.alpha(10),
      'boolean':     () => faker.datatype.boolean(),
      'number':      () => faker.number.int({ min: 1, max: 1000 }),
      'integer':     () => faker.number.int(),
      'float':       () => faker.number.float({ fractionDigits: 2 }),

      // Dates
      'date':        () => faker.date.recent().toISOString(),
      'pastDate':    () => faker.date.past().toISOString(),
      'futureDate':  () => faker.date.future().toISOString(),
      'recentDate':  () => faker.date.recent().toISOString(),

      // Person
      'firstName':   () => faker.person.firstName(),
      'lastName':    () => faker.person.lastName(),
      'fullName':    () => faker.person.fullName(),
      'email':       () => faker.internet.email(),
      'phone':       () => faker.phone.number({ style: 'international' }),
      'avatar':      () => `https://i.pravatar.cc/150?u=${faker.string.uuid()}`,

      // Business
      'company':     () => faker.company.name(),
      'jobTitle':    () => faker.person.jobTitle(),
      'url':         () => faker.internet.url(),
      'imageUrl':    () => `https://picsum.photos/seed/${faker.string.alphanumeric(6)}/400/300`,

      // Location
      'address':     () => faker.location.streetAddress(),
      'city':        () => faker.location.city(),
      'country':     () => faker.location.country(),
      'zipCode':     () => faker.location.zipCode(),
      'latitude':    () => parseFloat(faker.location.latitude().toString()),
      'longitude':   () => parseFloat(faker.location.longitude().toString()),

      // Content
      'sentence':    () => faker.lorem.sentence(),
      'paragraph':   () => faker.lorem.paragraph(),
      'word':        () => faker.lorem.word(),
      'words':       () => faker.lorem.words(3),

      // Commerce
      'productName': () => faker.commerce.productName(),
      'productDesc': () => faker.commerce.productDescription(),
      'price':       () => parseFloat(faker.commerce.price()),
      'currency':    () => faker.finance.currency().code,
    };

    const fn = generators[gen.toLowerCase()];
    if (!fn) {
      console.warn(`[RDF DataFactory] Unknown generator: "${gen}" in schema "${this.name}". Returning literal.`);
      return { type: 'string', generator: () => gen };
    }

    return { type: 'string', generator: fn };
  }

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------

  /**
   * Create one or many instances of this schema.
   */
  create(options?: FactoryInput): T | T[] {
    const count = options?.count ?? 1;
    const overrides = options?.overrides ?? {};

    if (options?.seed !== undefined) {
      faker.seed(options.seed);
    }

    if (count === 1) {
      return this.generateOne(0, overrides[0] as Partial<T>);
    }

    return Array.from({ length: count }).map((_, index) =>
      this.generateOne(index, overrides[index] as Partial<T>)
    );
  }

  // ---------------------------------------------------------------------------
  // Private generation
  // ---------------------------------------------------------------------------

  private generateOne(index: number, override?: Partial<T>): T {
    const context: GeneratorContext = { index, seed: 0, faker };
    const instance: Record<string, unknown> = {};

    Object.entries(this.normalizedSchema).forEach(([key, fieldDef]) => {
      const def = fieldDef as FieldDef;

      // Override takes priority
      if (override && key in override) {
        instance[key] = (override as Record<string, unknown>)[key];
        return;
      }

      let value: unknown;

      if (typeof def.generator === 'function') {
        value = def.generator(context);
      } else if (typeof def.generator === 'string') {
        const resolved = this.resolveGenerator(def.generator);
        value = (resolved.generator as (ctx: GeneratorContext) => unknown)(context);
      } else if (def.options?.enum) {
        value = def.options.enum[index % def.options.enum.length];
      } else {
        value = def.options?.default ?? null;
      }

      // Apply transform if defined
      if (def.transform && value !== null) {
        value = def.transform(value);
      }

      // Use default if still null
      if (value === null && def.options?.default !== undefined) {
        value = def.options.default;
      }

      instance[key] = value;
    });

    return instance as T;
  }

  /** Export generated data array to JSON or CSV string */
  export(data: T[], format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') return JSON.stringify(data, null, 2);

    if (!data.length) return '';
    const headers = Object.keys(data[0] as object);
    const rows = data.map(row =>
      headers
        .map(h => {
          const val = (row as Record<string, unknown>)[h];
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
}
