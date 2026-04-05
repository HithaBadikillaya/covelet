/**
 * Cove routes — privileged operations that require server-side execution.
 */

const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth');
const { isValidJoinCode, validateBody, validateParams } = require('../middleware/validate');
const { deleteLimiter, writeLimiter } = require('../middleware/rateLimiter');
const {
  backfillLegacyMemberships,
  joinCove,
  deleteCove,
  removeMember,
  getCoveStats,
  getTimeCapsuleStats,
  addReply,
} = require('../controllers/coveController');

const router = Router();

// All cove routes require authentication
router.use(authMiddleware);

router.post(
  '/backfill-memberships',
  writeLimiter,
  async (req, res, next) => {
    try {
      const result = await backfillLegacyMemberships(req.user.uid);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/join',
  writeLimiter,
  validateBody({
    joinCode: { type: 'string', maxLength: 6, required: true },
  }),
  async (req, res, next) => {
    const joinCode = typeof req.body?.joinCode === 'string'
      ? req.body.joinCode.trim().toUpperCase()
      : '';

    if (!isValidJoinCode(joinCode)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'joinCode must be a valid 6-character invite code.',
        },
      });
    }

    try {
      const result = await joinCove(req.user.uid, joinCode);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * DELETE /api/coves/:coveId
 * Server-side cascade delete — owner only.
 */
router.delete(
  '/:coveId',
  deleteLimiter,
  validateParams('coveId'),
  async (req, res, next) => {
    try {
      const result = await deleteCove(req.user.uid, req.params.coveId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/coves/:coveId/members/:memberId
 * Server-side atomic member removal — owner only.
 */
router.delete(
  '/:coveId/members/:memberId',
  deleteLimiter,
  validateParams('coveId', 'memberId'),
  async (req, res, next) => {
    try {
      const result = await removeMember(
        req.user.uid,
        req.params.coveId,
        req.params.memberId
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/coves/:coveId/stats
 * Aggregate cove statistics — members only.
 */
router.get(
  '/:coveId/stats',
  validateParams('coveId'),
  async (req, res, next) => {
    try {
      const stats = await getCoveStats(req.user.uid, req.params.coveId);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:coveId/time-capsules/:capsuleId/stats',
  validateParams('coveId', 'capsuleId'),
  async (req, res, next) => {
    try {
      const stats = await getTimeCapsuleStats(
        req.user.uid,
        req.params.coveId,
        req.params.capsuleId,
      );
      res.json(stats);
    } catch (err) {
      next(err);
    }
  },
);


/**
 * POST /api/coves/:coveId/quotes/:quoteId/replies
 * Add a reply and notify the quote author.
 */
router.post(
  '/:coveId/quotes/:quoteId/replies',
  writeLimiter,
  validateParams('coveId', 'quoteId'),
  validateBody({
    content: { type: 'string', required: true },
    authorName: { type: 'string', required: true },
  }),
  async (req, res, next) => {
    try {
      const result = await addReply(
        req.user.uid,
        req.params.coveId,
        req.params.quoteId,
        req.body.content,
        req.body.authorName,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
