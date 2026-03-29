/**
 * Cove controller — server-side business logic using Firebase Admin SDK.
 *
 * All operations verify ownership/membership server-side using the
 * authenticated user's UID from the verified token (never from client input).
 */

const { getFirestore } = require('../config/firebase');
const { logger } = require('../utils/logger');
const { isValidJoinCode } = require('../middleware/validate');

const DELETE_BATCH_SIZE = 200;

/**
 * Delete all documents in a collection in batches.
 * Optionally run a callback before each batch delete (for subcollection cleanup).
 */
async function deleteCollectionInBatches(db, collectionRef, beforeDelete) {
  while (true) {
    const snapshot = await collectionRef.limit(DELETE_BATCH_SIZE).get();
    if (snapshot.empty) return;

    // Run pre-delete hook for each doc (e.g., clean up subcollections)
    if (beforeDelete) {
      for (const doc of snapshot.docs) {
        await beforeDelete(doc);
      }
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    if (snapshot.size < DELETE_BATCH_SIZE) return;
  }
}

/**
 * Delete a cove and all its subcollections (cascade delete).
 * Verifies the caller is the cove owner.
 */
async function deleteCove(uid, coveId) {
  const db = getFirestore();

  // 1. Verify ownership — NEVER trust client-provided ownership
  const coveRef = db.collection('coves').doc(coveId);
  const coveSnap = await coveRef.get();

  if (!coveSnap.exists) {
    const err = new Error('Cove not found.');
    err.statusCode = 404;
    throw err;
  }

  const coveData = coveSnap.data();
  if (coveData.createdBy !== uid) {
    const err = new Error('Only the cove owner can delete this cove.');
    err.statusCode = 403;
    throw err;
  }

  logger.info('Starting cascade delete', { coveId, userId: uid });

  // 2. Delete subcollections in dependency order

  // Quotes → replies, upvotes
  await deleteCollectionInBatches(
    db,
    coveRef.collection('quotes'),
    async (quoteDoc) => {
      await deleteCollectionInBatches(db, quoteDoc.ref.collection('replies'));
      await deleteCollectionInBatches(db, quoteDoc.ref.collection('upvotes'));
    }
  );

  // Humans → likes
  await deleteCollectionInBatches(
    db,
    coveRef.collection('humans'),
    async (humanDoc) => {
      await deleteCollectionInBatches(db, humanDoc.ref.collection('likes'));
    }
  );

  // Time capsules → entries
  await deleteCollectionInBatches(
    db,
    coveRef.collection('timeCapsules'),
    async (capsuleDoc) => {
      await deleteCollectionInBatches(db, capsuleDoc.ref.collection('entries'));
    }
  );

  // Pins (no subcollections)
  await deleteCollectionInBatches(db, coveRef.collection('pins'));

  // Members data
  await deleteCollectionInBatches(db, coveRef.collection('members_data'));

  // Members subcollection
  await deleteCollectionInBatches(db, coveRef.collection('members'));

  // 3. Delete cove doc + join code in a batch
  const finalBatch = db.batch();
  finalBatch.delete(coveRef);

  if (coveData.joinCode && isValidJoinCode(coveData.joinCode)) {
    finalBatch.delete(db.collection('coveJoinCodes').doc(coveData.joinCode));
  }

  await finalBatch.commit();

  logger.info('Cascade delete complete', { coveId, userId: uid });
  return { deleted: true };
}

/**
 * Remove a member from a cove.
 * Verifies caller is the cove owner, prevents removing the owner.
 * Uses atomic batch write.
 */
async function removeMember(uid, coveId, memberId) {
  const db = getFirestore();
  const admin = require('firebase-admin');

  // 1. Verify ownership
  const coveRef = db.collection('coves').doc(coveId);
  const coveSnap = await coveRef.get();

  if (!coveSnap.exists) {
    const err = new Error('Cove not found.');
    err.statusCode = 404;
    throw err;
  }

  const coveData = coveSnap.data();
  if (coveData.createdBy !== uid) {
    const err = new Error('Only the cove owner can remove members.');
    err.statusCode = 403;
    throw err;
  }

  // 2. Prevent removing the owner
  if (memberId === coveData.createdBy) {
    const err = new Error('The cove owner cannot be removed.');
    err.statusCode = 400;
    throw err;
  }

  // 3. Verify the member exists in the array
  const members = Array.isArray(coveData.members) ? coveData.members : [];
  if (!members.includes(memberId)) {
    const err = new Error('This user is not a member of this cove.');
    err.statusCode = 404;
    throw err;
  }

  // 4. Atomic batch: remove from array + delete members_data
  const batch = db.batch();
  batch.update(coveRef, {
    members: admin.firestore.FieldValue.arrayRemove(memberId),
  });
  batch.delete(db.collection('coves').doc(coveId).collection('members_data').doc(memberId));

  // Also remove from members subcollection if it exists
  const memberDocRef = coveRef.collection('members').doc(memberId);
  const memberDocSnap = await memberDocRef.get();
  if (memberDocSnap.exists) {
    batch.delete(memberDocRef);
  }

  await batch.commit();

  logger.info('Member removed', { coveId, memberId, removedBy: uid });
  return { removed: true };
}

/**
 * Get aggregate stats for a cove.
 * Verifies caller is a member.
 */
async function getCoveStats(uid, coveId) {
  const db = getFirestore();

  const coveRef = db.collection('coves').doc(coveId);
  const coveSnap = await coveRef.get();

  if (!coveSnap.exists) {
    const err = new Error('Cove not found.');
    err.statusCode = 404;
    throw err;
  }

  const coveData = coveSnap.data();
  const members = Array.isArray(coveData.members) ? coveData.members : [];

  if (!members.includes(uid)) {
    const err = new Error('You are not a member of this cove.');
    err.statusCode = 403;
    throw err;
  }

  // Get counts (using count aggregation where possible)
  const [quotesSnap, pinsSnap, humansSnap, capsulesSnap] = await Promise.all([
    coveRef.collection('quotes').count().get(),
    coveRef.collection('pins').count().get(),
    coveRef.collection('humans').count().get(),
    coveRef.collection('timeCapsules').count().get(),
  ]);

  return {
    coveId,
    memberCount: members.length,
    quoteCount: quotesSnap.data().count,
    pinCount: pinsSnap.data().count,
    humanCount: humansSnap.data().count,
    capsuleCount: capsulesSnap.data().count,
  };
}

module.exports = { deleteCove, removeMember, getCoveStats };
