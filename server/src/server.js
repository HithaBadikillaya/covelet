/**
 * Covelet Express Server
 *
 * Production-hardened Express backend with:
 * - Firebase Admin SDK for privileged Firestore operations
 * - Firebase ID token verification on all protected routes
 * - Rate limiting, input validation, security headers
 * - Structured logging with sensitive data redaction
 * - Graceful shutdown handling
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { loadConfig } = require('./config/env');
const { initializeFirebase } = require('./config/firebase');
const { mountRoutes } = require('./routes/index');
const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const { logger } = require('./utils/logger');

// 1. Load and validate environment
const config = loadConfig();

// 2. Initialize Firebase Admin SDK
initializeFirebase(config);

// 3. Create Express app
const app = express();

// 4. Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Not needed for API-only server
  crossOriginEmbedderPolicy: false,
}));

// 5. CORS — restrictive in production
const corsOptions = {
  origin: config.isProduction
    ? config.cors.clientUrl.split(',').map((u) => u.trim()).filter(Boolean)
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // Cache preflight for 24 hours
};
app.use(cors(corsOptions));

// 6. Body parsing with size limit (prevent large payload attacks)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// 7. General rate limiting
app.use(generalLimiter);

// 8. Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.request(req, res.statusCode, Date.now() - start);
  });
  next();
});

// 9. Mount routes
mountRoutes(app);

// 10. 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found.`,
    },
  });
});

// 11. Global error handler (must be last middleware)
app.use(errorHandler);

// 12. Start server
const server = app.listen(config.port, () => {
  logger.info(`🚀 Covelet API server running`, {
    port: config.port,
    env: config.nodeEnv,
  });
});

// 13. Graceful shutdown
function gracefulShutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
