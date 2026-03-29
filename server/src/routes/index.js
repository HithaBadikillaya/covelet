/**
 * Route aggregator — mounts all route modules under /api.
 */

const healthRoutes = require('./health');
const coveRoutes = require('./coves');
const userRoutes = require('./users');

function mountRoutes(app) {
  app.use('/api/health', healthRoutes);
  app.use('/api/coves', coveRoutes);
  app.use('/api/users', userRoutes);
}

module.exports = { mountRoutes };
