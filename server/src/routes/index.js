/**
 * Route aggregator — mounts all route modules under /api.
 */

const healthRoutes = require('./health');
const coveRoutes = require('./coves');
const userRoutes = require('./users');
const { notificationRouter } = require('../services/notificationService');

function mountRoutes(app) {
  // Root route - confirms server is online
  app.get('/', (req, res) => {
    res.json({
      status: 'online',
      name: 'Covelet API',
      version: '1.0.0',
    });
  });

  app.use('/api/health', healthRoutes);
  app.use('/api/coves', coveRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/notifications', notificationRouter);
}

module.exports = { mountRoutes };
