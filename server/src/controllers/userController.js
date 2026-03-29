/**
 * User controller — server-side user operations.
 * Always uses the authenticated UID from the verified token.
 */

const { getFirestore } = require('../config/firebase');

/**
 * Get the current user's profile.
 * Uses req.user.uid (from verified token), never trusts client-provided IDs.
 */
async function getProfile(uid) {
  const db = getFirestore();
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    const err = new Error('User profile not found.');
    err.statusCode = 404;
    throw err;
  }

  const data = userSnap.data();

  // Return only safe fields — never expose internal metadata
  return {
    uid,
    name: data.name || 'User',
    email: data.email || null,
    avatarSeed: data.avatarSeed || uid,
  };
}

module.exports = { getProfile };
