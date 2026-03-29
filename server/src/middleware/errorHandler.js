/**
 * Global error handler middleware.
 *
 * - Returns consistent JSON error responses
 * - Maps Firebase errors to HTTP status codes
 * - Never leaks stack traces or internal paths in production
 */

const { logger } = require('../utils/logger');

const isProduction = process.env.NODE_ENV === 'production';

// Map Firebase Admin SDK error codes to HTTP status codes
const FIREBASE_ERROR_MAP = {
  'auth/user-not-found': 404,
  'auth/id-token-expired': 401,
  'auth/id-token-revoked': 401,
  'not-found': 404,
  'permission-denied': 403,
  'already-exists': 409,
  'failed-precondition': 400,
  'invalid-argument': 400,
  'resource-exhausted': 429,
  'unavailable': 503,
};

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  // Determine HTTP status code
  let statusCode = err.statusCode || err.status || 500;
  if (err.code && FIREBASE_ERROR_MAP[err.code]) {
    statusCode = FIREBASE_ERROR_MAP[err.code];
  }

  // Log the full error server-side
  logger.error('Request error', {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    userId: req.user?.uid,
    error: err,
  });

  // Build client-safe response
  const response = {
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: statusCode >= 500 && isProduction
        ? 'An internal error occurred. Please try again later.'
        : err.message || 'Something went wrong.',
    },
  };

  // Include stack trace only in development
  if (!isProduction && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = { errorHandler };
