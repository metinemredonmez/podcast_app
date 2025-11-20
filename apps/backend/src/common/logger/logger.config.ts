import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom log format for console (development)
const consoleFormat = printf(({ level, message, timestamp, context, trace, ...metadata }) => {
  let msg = `${timestamp} [${context || 'Application'}] ${level}: ${message}`;

  // Add metadata if present
  const metaKeys = Object.keys(metadata);
  if (metaKeys.length > 0) {
    msg += `\n${JSON.stringify(metadata, null, 2)}`;
  }

  // Add stack trace if present
  if (trace) {
    msg += `\n${trace}`;
  }

  return msg;
});

// Production JSON format
const productionFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  json(),
);

// Development human-readable format
const developmentFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  colorize({ all: true }),
  consoleFormat,
);

export const loggerConfig: WinstonModuleOptions = {
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
    }),

    // File transport for errors (production)
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: productionFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            format: productionFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],

  // Exit on error: false (don't exit on handled exceptions)
  exitOnError: false,
};
