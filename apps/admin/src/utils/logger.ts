/**
 * Development-only logger utility
 * Provides structured logging that only outputs in development mode
 */

const isDev = import.meta.env.DEV;

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LoggerOptions {
  prefix?: string;
  timestamp?: boolean;
}

const formatMessage = (level: LogLevel, prefix: string, message: string, timestamp: boolean): string => {
  const parts: string[] = [];

  if (timestamp) {
    parts.push(`[${new Date().toISOString()}]`);
  }

  parts.push(`[${level.toUpperCase()}]`);

  if (prefix) {
    parts.push(`[${prefix}]`);
  }

  parts.push(message);

  return parts.join(' ');
};

const createLogger = (options: LoggerOptions = {}) => {
  const { prefix = '', timestamp = false } = options;

  return {
    /**
     * Log general information (development only)
     */
    log: (message: string, ...args: unknown[]): void => {
      if (isDev) {
        console.log(formatMessage('log', prefix, message, timestamp), ...args);
      }
    },

    /**
     * Log informational messages (development only)
     */
    info: (message: string, ...args: unknown[]): void => {
      if (isDev) {
        console.info(formatMessage('info', prefix, message, timestamp), ...args);
      }
    },

    /**
     * Log warning messages (development only)
     */
    warn: (message: string, ...args: unknown[]): void => {
      if (isDev) {
        console.warn(formatMessage('warn', prefix, message, timestamp), ...args);
      }
    },

    /**
     * Log error messages (always - errors should be visible in production too)
     */
    error: (message: string, ...args: unknown[]): void => {
      console.error(formatMessage('error', prefix, message, timestamp), ...args);
    },

    /**
     * Log debug information (development only)
     */
    debug: (message: string, ...args: unknown[]): void => {
      if (isDev) {
        console.debug(formatMessage('debug', prefix, message, timestamp), ...args);
      }
    },

    /**
     * Log API request/response (development only)
     */
    api: (method: string, url: string, data?: unknown): void => {
      if (isDev) {
        console.log(
          `%c[API] ${method.toUpperCase()} ${url}`,
          'color: #3498db; font-weight: bold;',
          data || ''
        );
      }
    },

    /**
     * Log component lifecycle events (development only)
     */
    component: (componentName: string, event: string, data?: unknown): void => {
      if (isDev) {
        console.log(
          `%c[${componentName}] ${event}`,
          'color: #9b59b6; font-weight: bold;',
          data || ''
        );
      }
    },

    /**
     * Group related logs together (development only)
     */
    group: (label: string, fn: () => void): void => {
      if (isDev) {
        console.group(label);
        fn();
        console.groupEnd();
      }
    },

    /**
     * Log a table (development only)
     */
    table: (data: unknown): void => {
      if (isDev) {
        console.table(data);
      }
    },
  };
};

// Default logger instance
export const logger = createLogger();

// Factory function for creating prefixed loggers
export const createPrefixedLogger = (prefix: string, options?: Omit<LoggerOptions, 'prefix'>) =>
  createLogger({ ...options, prefix });

export default logger;
