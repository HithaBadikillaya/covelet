/**
 * Cove routes — privileged operations that require server-side execution.
 */

const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth');
const { validateParams } = require('../middleware/validate');
const { deleteLimiter } = require('../middleware/rateLimiter');
const { deleteCove, removeMember, getCoveStats } = require('../controllers/coveController');

const router = Router();

// All cove routes require authentication
router.use(authMiddleware);

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

module.exports = router;
