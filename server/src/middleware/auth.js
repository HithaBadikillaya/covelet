/**
 * Firebase ID Token verification middleware.
 *
 * - Extracts Bearer token from Authorization header
 * - Verifies with Firebase Admin SDK (checks expiry + revocation)
 * - Attaches decoded user to req.user
 * - Rejects all unauthenticated or malformed requests
 */

const { getAuth } = require('../config/firebase');
const { logger } = require('../utils/logger');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'AUTH_MISSING',
        message: 'Authorization header with Bearer token is required.',
      },
    });
  }

  const token = authHeader.split('Bearer ')[1];

  if (!token || token.length < 20) {
    return res.status(401).json({
      error: {
        code: 'AUTH_MALFORMED',
        message: 'Invalid authorization token format.',
      },
    });
  }

  try {
    const auth = getAuth();
    // checkRevoked: true ensures we reject tokens for disabled/deleted users
    const decoded = await auth.verifyIdToken(token, true);

    // Attach only safe, minimal user info to request
    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
    };

    next();
  } catch (err) {
    logger.warn('Auth token verification failed', {
      code: err.code,
      ip: req.ip,
    });

    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: {
          code: 'AUTH_EXPIRED',
          message: 'Your session has expired. Please sign in again.',
        },
      });
    }

    if (err.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        error: {
          code: 'AUTH_REVOKED',
          message: 'Your session has been revoked. Please sign in again.',
        },
      });
    }

    return res.status(401).json({
      error: {
        code: 'AUTH_INVALID',
        message: 'Invalid authorization token.',
      },
    });
  }
}

module.exports = { authMiddleware };
