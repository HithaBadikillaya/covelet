/**
 * Structured logger that redacts sensitive data in production.
 * In development, logs plaintext. In production, logs JSON for log aggregators.
 */

const isProduction = process.env.NODE_ENV === 'production';

const REDACTED_FIELDS = ['token', 'password', 'secret', 'authorization', 'email'];

function redactSensitive(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const redacted = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (REDACTED_FIELDS.some((field) => lowerKey.includes(field))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitive(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

function formatMessage(level, message, meta) {
  const timestamp = new Date().toISOString();

  if (isProduction) {
    const entry = {
      timestamp,
      level,
      message,
      ...(meta ? redactSensitive(meta) : {}),
    };
    return JSON.stringify(entry);
  }

  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
}

const logger = {
  info(message, meta) {
    console.log(formatMessage('info', message, meta));
  },

  warn(message, meta) {
    console.warn(formatMessage('warn', message, meta));
  },

  error(message, meta) {
    // In production, don't log full error stack in the structured output
    if (isProduction && meta?.error instanceof Error) {
      meta = { ...meta, error: meta.error.message };
    }
    console.error(formatMessage('error', message, meta));
  },

  request(req, statusCode, durationMs) {
    const meta = {
      method: req.method,
      path: req.originalUrl,
      status: statusCode,
      durationMs,
      userId: req.user?.uid || 'anonymous',
      ip: isProduction ? undefined : req.ip,
    };
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    logger[level](`${req.method} ${req.originalUrl} ${statusCode}`, meta);
  },
};

module.exports = { logger };
