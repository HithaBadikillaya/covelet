/**
 * Request input validation middleware.
 *
 * Sanitizes string inputs and validates against security limits.
 * Reuses the same limits as the client-side security.ts.
 */

const SECURITY_LIMITS = {
  coveName: 50,
  coveDescription: 180,
  avatarSeed: 80,
  joinCodeLength: 6,
  maxMembersPerCove: 50,
  pinTitle: 40,
  pinDescription: 300,
  quoteContent: 500,
  replyContent: 280,
  memberRole: 30,
  memberBio: 150,
  timeCapsuleEntry: 500,
};

const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;

function stripControlChars(value) {
  return value.replace(CONTROL_CHARS_REGEX, '');
}

function sanitizeString(value, maxLength) {
  if (typeof value !== 'string') return '';
  return stripControlChars(value).replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function isValidFirestoreId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id);
}

function isValidJoinCode(value) {
  return typeof value === 'string' && /^[A-Z0-9]{6}$/.test(value);
}

/**
 * Middleware factory: validates that req.params contain valid Firestore doc IDs.
 * @param  {...string} paramNames - Names of params to validate
 */
function validateParams(...paramNames) {
  return (req, res, next) => {
    for (const name of paramNames) {
      const value = req.params[name];
      if (!value || !isValidFirestoreId(value)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_PARAM',
            message: `Invalid parameter: ${name}. Must be a valid document ID.`,
          },
        });
      }
    }
    next();
  };
}

/**
 * Middleware factory: validates required body fields exist and are within limits.
 * @param {Object} schema - { fieldName: { type: 'string', maxLength: number, required: boolean } }
 */
function validateBody(schema) {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        error: {
          code: 'INVALID_BODY',
          message: 'Request body is required and must be JSON.',
        },
      });
    }

    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required.`);
        continue;
      }

      if (value === undefined || value === null) continue;

      if (rules.type === 'string') {
        if (typeof value !== 'string') {
          errors.push(`${field} must be a string.`);
        } else if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} exceeds maximum length of ${rules.maxLength}.`);
        }
      }

      if (rules.type === 'number') {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          errors.push(`${field} must be a number.`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: errors.join(' '),
          details: errors,
        },
      });
    }

    next();
  };
}

module.exports = {
  SECURITY_LIMITS,
  sanitizeString,
  isValidFirestoreId,
  isValidJoinCode,
  validateParams,
  validateBody,
};
