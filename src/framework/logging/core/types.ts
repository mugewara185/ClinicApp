/**
 * RDF Logger Types
 * Core TypeScript interfaces for the structured logging system.
 * Based on FRAMEWORK_DESIGN.md §3.2 and FRAMEWORK_IMPLEMENTATION_GUIDE.md Phase 1.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface LogEntry {
  /** UUID for unique identification */
  id: string;
  /** ms since epoch */
  timestamp: number;
  level: LogLevel;
  /** Hierarchical namespace, e.g. 'api:request:GET', 'component:lifecycle:mount' */
  namespace: string;
  message: string;
  /** Structured context data (auto-sanitized for secrets) */
  data?: unknown;
  /** Stack trace — populated for ERROR and CRITICAL only */
  stackTrace?: string;
  /** Tags for filtering, e.g. ['api', 'request'] */
  tags?: string[];
  /** Duration in ms — for performance spans */
  duration?: number;
  /** Source file/component origin */
  source?: string;
}

export interface LoggerConfig {
  /** Max entries kept in memory */
  maxLogs: number;
  /** Persist last 100 logs to localStorage */
  persistLogs: boolean;
  /** Minimum level to log */
  minLevel: LogLevel;
  enableStackTrace: boolean;
  enableTimestamps: boolean;
  enableGrouping: boolean;
  colors: {
    DEBUG: { css: string; emoji: string };
    INFO: { css: string; emoji: string };
    WARN: { css: string; emoji: string };
    ERROR: { css: string; emoji: string };
    CRITICAL: { css: string; emoji: string };
  };
}

export interface FilterOptions {
  level?: LogLevel | LogLevel[];
  /** Regex pattern matched against namespace */
  namespace?: string;
  /** Full-text search across message and data */
  search?: string;
  tags?: string[];
  timeRange?: { start: number; end: number };
}

export interface LogStats {
  total: number;
  byLevel: Record<LogLevel, number>;
  byNamespace: Record<string, number>;
  avgDuration?: number;
}
