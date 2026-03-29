/**
 * Rate limiting middleware.
 *
 * - General: 100 requests per 15 minutes per IP
 * - Write operations: 30 per minute per authenticated user
 * - Delete operations: 10 per minute per authenticated user
 */

const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
    },
  },
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.uid || req.ip,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many write requests. Please wait a moment.',
    },
  },
});

const deleteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.uid || req.ip,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many delete requests. Please wait a moment.',
    },
  },
});

module.exports = { generalLimiter, writeLimiter, deleteLimiter };
