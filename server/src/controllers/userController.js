/**
 * User controller — server-side user operations.
 * Always uses the authenticated UID from the verified token.
 */

const { getFirestore } = require('../config/firebase');
const { admin } = require('../config/firebase');

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

async function upsertDevice(uid, deviceId, payload) {
  const db = getFirestore();

  await db.collection('users').doc(uid).collection('devices').doc(deviceId).set(
    {
      expoPushToken: payload.expoPushToken,
      platform: payload.platform,
      deviceName: payload.deviceName ?? null,
      appVersion: payload.appVersion ?? null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return {
    deviceId,
    saved: true,
  };
}

module.exports = { getProfile, upsertDevice };
