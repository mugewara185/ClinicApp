/**
 * RDF Logger Core
 * Structured, namespaced logging with color output and localStorage persistence.
 * Extracted verbatim from FRAMEWORK_IMPLEMENTATION_GUIDE.md Phase 1, Step 1.1.
 *
 * Usage:
 *   import { logger } from '@/framework';
 *   logger.info('booking:submit', 'Form submitted', { name: 'Ali' });
 *   logger.error('api:whatsapp', 'WhatsApp call failed', error);
 *
 * Browser console query (via window.__DEV__):
 *   window.__DEV__.logger.getLogs({ level: 'ERROR' });
 */

import { v4 as uuidv4 } from 'uuid';
import type { LogEntry, LogLevel, LoggerConfig, FilterOptions, LogStats } from './types';

// ---------------------------------------------------------------------------
// Color mapping for console.log %c styling
// ---------------------------------------------------------------------------
const LOG_COLORS: LoggerConfig['colors'] = {
  DEBUG:    { css: 'color: #666; font-size: 12px;',                                                          emoji: '🐛' },
  INFO:     { css: 'color: #1976d2; font-weight: bold;',                                                     emoji: 'ℹ️' },
  WARN:     { css: 'color: #f57c00; font-weight: bold;',                                                     emoji: '⚠️' },
  ERROR:    { css: 'color: #d32f2f; font-weight: bold;',                                                     emoji: '❌' },
  CRITICAL: { css: 'color: #d32f2f; font-size: 14px; font-weight: bold; text-decoration: underline;',       emoji: '🚨' },
};

// Numeric priority for level comparison
const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG:    0,
  INFO:     1,
  WARN:     2,
  ERROR:    3,
  CRITICAL: 4,
};

// ---------------------------------------------------------------------------
// Logger class
// ---------------------------------------------------------------------------
class Logger {
  private logs: LogEntry[] = [];
  private config: LoggerConfig;
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();
  private paused = false;

  constructor(config: Partial<LoggerConfig> = {}) {
    const defaults: LoggerConfig = {
      maxLogs: 500,
      persistLogs: true,
      minLevel: 'DEBUG',
      enableStackTrace: true,
      enableTimestamps: true,
      enableGrouping: true,
      colors: LOG_COLORS,
    };
    this.config = { ...defaults, ...config };
    this.loadLogs();
  }

  // -------------------------------------------------------------------------
  // Core private log method
  // -------------------------------------------------------------------------
  private log(
    level: LogLevel,
    namespace: string,
    message: string,
    data?: unknown,
    tags?: string[]
  ): LogEntry {
    if (this.paused || LOG_LEVELS[level] < LOG_LEVELS[this.config.minLevel]) {
      return {} as LogEntry;
    }

    const entry: LogEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      level,
      namespace,
      message,
      data: this.sanitizeData(data),
      tags: [...(tags || []), level.toLowerCase()],
      source: this.getSource(),
    };

    if ((level === 'ERROR' || level === 'CRITICAL') && this.config.enableStackTrace) {
      entry.stackTrace = this.getStackTrace();
    }

    this.logs.push(entry);

    // Enforce maxLogs buffer
    if (this.logs.length > this.config.maxLogs) {
      this.logs.shift();
    }

    if (this.config.persistLogs) {
      this.saveLogs();
    }

    this.notifyListeners();
    this.consoleLog(entry);

    return entry;
  }

  // -------------------------------------------------------------------------
  // Public API — logging methods
  // -------------------------------------------------------------------------

  debug(namespace: string, message: string, data?: unknown, tags?: string[]): LogEntry {
    return this.log('DEBUG', namespace, message, data, tags);
  }

  info(namespace: string, message: string, data?: unknown, tags?: string[]): LogEntry {
    return this.log('INFO', namespace, message, data, tags);
  }

  warn(namespace: string, message: string, data?: unknown, tags?: string[]): LogEntry {
    return this.log('WARN', namespace, message, data, tags);
  }

  error(namespace: string, message: string, data?: unknown, tags?: string[]): LogEntry {
    return this.log('ERROR', namespace, message, data, tags);
  }

  critical(namespace: string, message: string, data?: unknown, tags?: string[]): LogEntry {
    return this.log('CRITICAL', namespace, message, data, tags);
  }

  // -------------------------------------------------------------------------
  // Performance spans
  // -------------------------------------------------------------------------

  /**
   * Start a named performance span.
   * @example
   *   const span = logger.startSpan('booking:whatsapp');
   *   await sendWhatsApp(data);
   *   span.end({ status: 200 });
   */
  startSpan(namespace: string) {
    const startTime = performance.now();
    return {
      end: (data?: unknown) => {
        const duration = performance.now() - startTime;
        return this.info(namespace, `Completed in ${duration.toFixed(2)}ms`, { ...((data as object) ?? {}), duration });
      },
    };
  }

  // -------------------------------------------------------------------------
  // Query & Filter
  // -------------------------------------------------------------------------

  getLogs(filters?: FilterOptions): LogEntry[] {
    let filtered = [...this.logs];

    if (!filters) return filtered;

    if (filters.level) {
      const levels = Array.isArray(filters.level) ? filters.level : [filters.level];
      filtered = filtered.filter(log => levels.includes(log.level));
    }

    if (filters.namespace) {
      const regex = new RegExp(filters.namespace, 'i');
      filtered = filtered.filter(log => regex.test(log.namespace));
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        log =>
          log.message.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.data).toLowerCase().includes(searchLower)
      );
    }

    if (filters.tags?.length) {
      filtered = filtered.filter(log =>
        filters.tags!.some(tag => log.tags?.includes(tag))
      );
    }

    if (filters.timeRange) {
      filtered = filtered.filter(
        log =>
          log.timestamp >= filters.timeRange!.start &&
          log.timestamp <= filters.timeRange!.end
      );
    }

    return filtered;
  }

  getByNamespace(pattern: string): LogEntry[] {
    const regex = new RegExp(pattern, 'i');
    return this.logs.filter(log => regex.test(log.namespace));
  }

  getByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  getRecent(count: number): LogEntry[] {
    return this.logs.slice(-count);
  }

  // -------------------------------------------------------------------------
  // Statistics
  // -------------------------------------------------------------------------

  stats(): LogStats {
    const stats: LogStats = {
      total: this.logs.length,
      byLevel: { DEBUG: 0, INFO: 0, WARN: 0, ERROR: 0, CRITICAL: 0 },
      byNamespace: {},
    };

    const durations: number[] = [];

    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
      stats.byNamespace[log.namespace] = (stats.byNamespace[log.namespace] || 0) + 1;
      if (log.duration) durations.push(log.duration);
    });

    return {
      ...stats,
      avgDuration: durations.length
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0,
    };
  }

  // -------------------------------------------------------------------------
  // Export
  // -------------------------------------------------------------------------

  export(format: 'json' | 'csv' | 'html' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }

    if (format === 'csv') {
      const headers = ['id', 'timestamp', 'level', 'namespace', 'message', 'data', 'tags'];
      const rows = this.logs.map(log =>
        headers
          .map(key => {
            const value = (log as unknown as Record<string, unknown>)[key];
            const str = typeof value === 'object' ? JSON.stringify(value) : String((value as unknown) ?? '');
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(',')
      );
      return [headers.join(','), ...rows].join('\n');
    }

    // HTML table format
    return `
      <html>
        <head>
          <style>
            body { font-family: monospace; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .DEBUG { color: #666; } .INFO { color: #1976d2; }
            .WARN { color: #f57c00; } .ERROR { color: #d32f2f; }
            .CRITICAL { color: #d32f2f; font-weight: bold; }
          </style>
        </head>
        <body>
          <table>
            <tr><th>Time</th><th>Level</th><th>Namespace</th><th>Message</th><th>Data</th></tr>
            ${this.logs
              .map(
                log => `
              <tr>
                <td>${new Date(log.timestamp).toLocaleTimeString()}</td>
                <td class="${log.level}">${log.level}</td>
                <td>${log.namespace}</td>
                <td>${log.message}</td>
                <td><pre>${JSON.stringify(log.data, null, 2)}</pre></td>
              </tr>`
              )
              .join('')}
          </table>
        </body>
      </html>`;
  }

  // -------------------------------------------------------------------------
  // Control
  // -------------------------------------------------------------------------

  setLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  clear(namespace?: string): void {
    if (namespace) {
      const regex = new RegExp(namespace, 'i');
      this.logs = this.logs.filter(log => !regex.test(log.namespace));
    } else {
      this.logs = [];
    }
    if (this.config.persistLogs) this.saveLogs();
    this.notifyListeners();
  }

  // Subscribe to log changes (used by LogConsole component)
  subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private consoleLog(entry: LogEntry): void {
    if (typeof window === 'undefined') return;

    const color = this.config.colors[entry.level];
    const timestamp = this.config.enableTimestamps
      ? new Date(entry.timestamp).toLocaleTimeString()
      : '';

    // console.log(
    //   `%c${color.emoji} [${timestamp}] [${entry.level}] ${entry.namespace}`,
    //   color.css,
    //   '—',
    //   entry.message,
    //   entry.data ? '→' : '',
    //   entry.data || ''
    // );
  }

  /** Strip sensitive fields like password, token, key, secret */
  private sanitizeData(data: unknown): unknown {
    if (data && typeof data === 'object') {
      const obj = JSON.parse(JSON.stringify(data));
      const sanitize = (o: Record<string, unknown>) => {
        Object.keys(o).forEach(key => {
          if (/password|secret|token|key|credential|apikey/i.test(key)) {
            o[key] = '***REDACTED***';
          } else if (o[key] && typeof o[key] === 'object') {
            sanitize(o[key] as Record<string, unknown>);
          }
        });
      };
      sanitize(obj);
      return obj;
    }
    return data;
  }

  private getStackTrace(): string {
    if (!(new Error()).stack) return '';
    return new Error().stack?.split('\n').slice(3).join('\n') ?? '';
  }

  private getSource(): string {
    try {
      const stack = new Error().stack || '';
      const line = stack.split('\n')[4];
      const match = line?.match(/at (\S+)/);
      return match ? match[1] : 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private saveLogs(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('__rdf_logs', JSON.stringify(this.logs.slice(-100)));
      }
    } catch (e) {
      console.warn('RDF Logger: Failed to persist logs', e);
    }
  }

  private loadLogs(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('__rdf_logs');
        if (stored) {
          this.logs = JSON.parse(stored);
        }
      }
    } catch (e) {
      console.warn('RDF Logger: Failed to load persisted logs', e);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.logs]));
  }
}

// Export singleton instance (used throughout the app)
export const logger = new Logger();
export { Logger };
