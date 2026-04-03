/**
 * User routes.
 */

const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth');
const { getProfile, upsertDevice } = require('../controllers/userController');
const { validateBody, validateParams } = require('../middleware/validate');

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

router.put(
  '/me/devices/:deviceId',
  validateParams('deviceId'),
  validateBody({
    expoPushToken: { type: 'string', maxLength: 255, required: true },
    platform: { type: 'string', maxLength: 20, required: true },
    deviceName: { type: 'string', maxLength: 120, required: false },
    appVersion: { type: 'string', maxLength: 40, required: false },
  }),
  async (req, res, next) => {
    try {
      const result = await upsertDevice(req.user.uid, req.params.deviceId, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
