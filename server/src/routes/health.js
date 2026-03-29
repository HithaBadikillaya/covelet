/**
 * Health check route — no auth required.
 * Used by Render/deployment platforms to verify the server is alive.
 */

const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'covelet-api',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

module.exports = router;
