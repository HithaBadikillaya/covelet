/**
 * User routes.
 */

const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth');
const { getProfile } = require('../controllers/userController');

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

/**
 * GET /api/users/me
 * Returns the authenticated user's profile.
 * Uses req.user.uid from verified token — never trusts client-supplied IDs.
 */
router.get('/me', async (req, res, next) => {
  try {
    const profile = await getProfile(req.user.uid);
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
