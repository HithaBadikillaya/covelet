/**
 * Environment configuration with validation.
 * Fails fast on startup if required variables are missing.
 */

const requiredVars = ['FIREBASE_PROJECT_ID'];

function validateEnv() {
  const missing = requiredVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variables:\n${missing.map((v) => `   - ${v}`).join('\n')}`
    );
    console.error('\nCopy server/.env.example to server/.env and fill in the values.');
    process.exit(1);
  }
}

function loadConfig() {
  validateEnv();

  return {
    port: parseInt(process.env.PORT, 10) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',

    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || null,
      serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || null,
    },

    cors: {
      clientUrl: process.env.CLIENT_URL || 'http://localhost:8081',
    },
  };
}

module.exports = { loadConfig };
