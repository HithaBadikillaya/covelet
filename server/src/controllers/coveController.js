/**
 * Cove controller — server-side business logic using Firebase Admin SDK.
 *
 * All operations verify ownership/membership server-side using the
 * authenticated user's UID from the verified token (never from client input).
 */

const admin = require('firebase-admin');
const { getFirestore } = require('../config/firebase');
const { logger } = require('../utils/logger');
const { SECURITY_LIMITS, isValidJoinCode } = require('../middleware/validate');
const { sendExpoPushNotifications, isExpoPushToken } = require('../services/expoPush');

// No longer need DELETE_BATCH_SIZE as we use native recursiveDelete for cascade operations.

function getLegacyMemberIds(coveData) {
  if (!Array.isArray(coveData?.members)) {
    return [];
  }

  return Array.from(
    new Set(
      coveData.members.filter((memberId) => typeof memberId === 'string' && memberId.trim()),
    ),
  );
}

function resolveMemberCount(coveData) {
  const legacyCount = getLegacyMemberIds(coveData).length;
  const storedCount = Number.isFinite(coveData?.memberCount) ? coveData.memberCount : 0;
  return Math.max(storedCount, legacyCount);
}

async function ensureMemberDocument(coveRef, userId) {
  const memberRef = coveRef.collection('members').doc(userId);
  const memberSnap = await memberRef.get();

  if (memberSnap.exists) {
    return memberRef;
  }

  const legacyMemberDataRef = coveRef.collection('members_data').doc(userId);
  const legacyMemberDataSnap = await legacyMemberDataRef.get();
  const legacyJoinedAt = legacyMemberDataSnap.exists ? legacyMemberDataSnap.data()?.joinedAt : null;

  await memberRef.set({
    userId,
    joinedAt: legacyJoinedAt || admin.firestore.FieldValue.serverTimestamp(),
  });

  return memberRef;
}

async function getCoveMemberIds(coveRef, coveData) {
  const memberSnapshot = await coveRef.collection('members').get();
  const memberIds = memberSnapshot.docs.map((memberDoc) => memberDoc.id);
  const legacyMemberIds = getLegacyMemberIds(coveData);

  return Array.from(new Set([...memberIds, ...legacyMemberIds]));
}

async function getCoveForMember(uid, coveId) {
  const db = getFirestore();
  const coveRef = db.collection('coves').doc(coveId);
  const coveSnap = await coveRef.get();

  if (!coveSnap.exists) {
    const err = new Error('Cove not found.');
    err.statusCode = 404;
    err.code = 'not-found';
    throw err;
  }

  const coveData = coveSnap.data();
  const memberRef = coveRef.collection('members').doc(uid);
  const memberSnap = await memberRef.get();
  const legacyMembers = getLegacyMemberIds(coveData);
  const isMember = memberSnap.exists || legacyMembers.includes(uid);

  if (!isMember) {
    const err = new Error('You are not a member of this cove.');
    err.statusCode = 403;
    err.code = 'permission-denied';
    throw err;
  }

  if (!memberSnap.exists && legacyMembers.includes(uid)) {
    await ensureMemberDocument(coveRef, uid);
  }

  return { db, coveRef, coveData, memberCount: resolveMemberCount(coveData) };
}

async function getCoveForOwner(uid, coveId) {
  const { db, coveRef, coveData } = await getCoveForMember(uid, coveId);

  if (coveData.createdBy !== uid) {
    const err = new Error('Only the cove owner can perform this action.');
    err.statusCode = 403;
    err.code = 'permission-denied';
    throw err;
  }

  return { db, coveRef, coveData };
}

async function getCapsuleRefForCove(coveRef, capsuleId) {
  const capsuleRef = coveRef.collection('timeCapsules').doc(capsuleId);
  const capsuleSnap = await capsuleRef.get();

  if (!capsuleSnap.exists) {
    const err = new Error('Time capsule not found.');
    err.statusCode = 404;
    err.code = 'not-found';
    throw err;
  }

  return { capsuleRef, capsuleData: capsuleSnap.data() };
}

async function collectExpoPushTokens(db, memberIds) {
  const deviceSnapshots = await Promise.all(
    memberIds.map((memberId) =>
      db.collection('users').doc(memberId).collection('devices').get(),
    ),
  );

  const tokens = new Set();

  deviceSnapshots.forEach((snapshot) => {
    snapshot.docs.forEach((deviceDoc) => {
      const expoPushToken = deviceDoc.data()?.expoPushToken;
      if (isExpoPushToken(expoPushToken)) {
        tokens.add(expoPushToken);
      }
    });
  });

  return Array.from(tokens);
}

async function notifyCoveMembersCapsuleOpened(db, coveRef, coveData, coveId, capsuleId) {
  const memberIds = await getCoveMemberIds(coveRef, coveData);
  const tokens = await collectExpoPushTokens(db, memberIds);

  if (tokens.length === 0) {
    return { notifiedDevices: 0 };
  }

  await sendExpoPushNotifications(
    tokens.map((token) => ({
      to: token,
      title: 'Time Capsule Opened',
      body: `${coveData.name || 'Your Cove'} is ready to open. Tap to read what your Cove left behind.`,
      sound: 'default',
      priority: 'high',
      data: {
        type: 'time-capsule-opened',
        route: `/dashboard/cove/${coveId}/time-capsule`,
        coveId,
        capsuleId,
      },
    })),
  );

  return { notifiedDevices: tokens.length };
}

async function joinCove(uid, joinCode) {
  const normalizedJoinCode = typeof joinCode === 'string' ? joinCode.trim().toUpperCase() : '';
  if (!isValidJoinCode(normalizedJoinCode)) {
    const err = new Error('Invalid invite code.');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const db = getFirestore();

  const result = await db.runTransaction(async (transaction) => {
    const joinCodeRef = db.collection('coveJoinCodes').doc(normalizedJoinCode);
    const joinCodeSnap = await transaction.get(joinCodeRef);

    if (!joinCodeSnap.exists) {
      const err = new Error('No Cove found with this code.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const coveId = joinCodeSnap.data()?.coveId;
    if (typeof coveId !== 'string' || !coveId.trim()) {
      transaction.delete(joinCodeRef);
      return { deletedStaleJoinCode: true };
    }

    const coveRef = db.collection('coves').doc(coveId);
    const coveSnap = await transaction.get(coveRef);

    if (!coveSnap.exists) {
      transaction.delete(joinCodeRef);
      return { deletedStaleJoinCode: true };
    }

    const coveData = coveSnap.data();
    const memberRef = coveRef.collection('members').doc(uid);
    const memberSnap = await transaction.get(memberRef);
    const memberDataRef = coveRef.collection('members_data').doc(uid);
    const memberDataSnap = await transaction.get(memberDataRef);
    const legacyMembers = getLegacyMemberIds(coveData);
    const currentCount = resolveMemberCount(coveData);
    const payload = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      role: typeof memberDataSnap.data()?.role === 'string' ? memberDataSnap.data().role : '',
      bio: typeof memberDataSnap.data()?.bio === 'string' ? memberDataSnap.data().bio : '',
    };

    if (!memberDataSnap.exists || !memberDataSnap.data()?.joinedAt) {
      payload.joinedAt = admin.firestore.FieldValue.serverTimestamp();
    }

    if (memberSnap.exists || legacyMembers.includes(uid)) {
      if (!memberSnap.exists) {
        transaction.set(memberRef, {
          userId: uid,
          joinedAt: memberDataSnap.data()?.joinedAt || admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      transaction.set(memberDataRef, payload, { merge: true });
      return { coveId, joined: true, alreadyMember: true };
    }

    if (currentCount >= SECURITY_LIMITS.maxMembersPerCove) {
      const err = new Error('This cove is full.');
      err.statusCode = 409;
      err.code = 'COVE_FULL';
      throw err;
    }

    transaction.set(memberRef, {
      userId: uid,
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    transaction.set(memberDataRef, payload, { merge: true });
    transaction.update(coveRef, {
      memberCount: currentCount + 1,
    });

    return { coveId, joined: true, alreadyMember: false };
  });

  if (result?.deletedStaleJoinCode) {
    const err = new Error('This invite code is no longer valid.');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return result;
}

async function getJoinCodeRefsForCove(db, coveId, joinCode) {
  const joinCodeRefs = new Map();

  if (typeof joinCode === 'string' && isValidJoinCode(joinCode)) {
    joinCodeRefs.set(joinCode, db.collection('coveJoinCodes').doc(joinCode));
  }

  const joinCodeSnapshot = await db.collection('coveJoinCodes')
    .where('coveId', '==', coveId)
    .get();

  joinCodeSnapshot.docs.forEach((joinCodeDoc) => {
    joinCodeRefs.set(joinCodeDoc.id, joinCodeDoc.ref);
  });

  return Array.from(joinCodeRefs.values());
}

async function backfillLegacyMemberships(uid) {
  const db = getFirestore();
  const [ownerCovesSnapshot, memberDataSnapshot, legacyMemberCovesSnapshot] = await Promise.all([
    db.collection('coves').where('createdBy', '==', uid).get(),
    db.collectionGroup('members_data')
      .where(admin.firestore.FieldPath.documentId(), '==', uid)
      .get(),
    db.collection('coves').where('members', 'array-contains', uid).get(),
  ]);
  const memberDataCoveSnapshots = await Promise.all(
    memberDataSnapshot.docs.map((memberDataDoc) => memberDataDoc.ref.parent.parent?.get()),
  );

  const legacyCoveSnapshots = new Map();

  ownerCovesSnapshot.docs.forEach((docSnap) => {
    legacyCoveSnapshots.set(docSnap.id, docSnap);
  });

  legacyMemberCovesSnapshot.docs.forEach((docSnap) => {
    legacyCoveSnapshots.set(docSnap.id, docSnap);
  });

  memberDataCoveSnapshots.forEach((coveSnap) => {
    if (!coveSnap?.exists) {
      return;
    }

    legacyCoveSnapshots.set(coveSnap.id, coveSnap);
  });

  let backfilledCount = 0;
  let migratedCoves = 0;

  for (const coveSnap of legacyCoveSnapshots.values()) {
    const coveData = coveSnap.data();
    const coveRef = coveSnap.ref;
    const legacyMemberIds = getLegacyMemberIds(coveData);
    const isOwner = coveData.createdBy === uid;

    if (isOwner) {
      const targetMemberIds = Array.from(new Set([
        uid,
        ...legacyMemberIds,
      ]));

      await Promise.all(targetMemberIds.map((memberId) => ensureMemberDocument(coveRef, memberId)));

      const nextMemberCount = Math.max(resolveMemberCount(coveData), targetMemberIds.length, 1);
      const coveUpdates = {
        memberCount: nextMemberCount,
      };

      if ('members' in coveData) {
        coveUpdates.members = admin.firestore.FieldValue.delete();
      }

      if ('members' in coveData || nextMemberCount !== coveData.memberCount) {
        await coveRef.set(coveUpdates, { merge: true });
      }

      backfilledCount += targetMemberIds.length;
      migratedCoves += 1;
      continue;
    }

    if (!legacyMemberIds.includes(uid)) {
      continue;
    }

    await ensureMemberDocument(coveRef, uid);

    const nextMemberCount = resolveMemberCount(coveData);
    if (nextMemberCount !== coveData.memberCount) {
      await coveRef.set({ memberCount: nextMemberCount }, { merge: true });
    }

    backfilledCount += 1;
  }

  return {
    backfilledCount,
    migratedCoves,
  };
}

// Deprecated manual deletion logic in favor of db.recursiveDelete()

async function deleteCove(uid, coveId) {
  const { db, coveRef, coveData } = await getCoveForOwner(uid, coveId);
  const joinCodeRefs = await getJoinCodeRefsForCove(db, coveId, coveData.joinCode);

  logger.info('Starting optimized cascade delete', { coveId, userId: uid });

  // 1. Delete associated join code records AND the cove document itself in an atomic batch.
  // This ensures the cove immediately disappears from dashboards and triggers client listeners.
  const batch = db.batch();

  // Delete all join codes
  if (joinCodeRefs.length > 0) {
    joinCodeRefs.forEach((ref) => batch.delete(ref));
  }

  // Delete the cove document itself
  batch.delete(coveRef);

  // Commit the primary deletion batch
  await batch.commit();

  logger.info('Primary document and join codes deleted', { coveId });

  // 2. Perform recursive delete on the coveRef to clean up all subcollections.
  // This is run asynchronously so the client request can return success immediately.
  // Native Firestore recursive delete is efficient and handles back-end batching.
  db.recursiveDelete(coveRef)
    .then(() => {
      logger.info('Cascade subcollection cleanup complete', { coveId, userId: uid });
    })
    .catch((error) => {
      // If subcollection cleanup fails, we log it. The main cove document is already gone.
      logger.error('Cascade subcollection cleanup failed', { coveId, userId: uid, error });
    });

  return { deleted: true };
}

/**
 * Remove a member from a cove.
 * Verifies caller is the cove owner, prevents removing the owner.
 * Uses atomic batch write.
 */
async function removeMember(uid, coveId, memberId) {
  const { db, coveRef, coveData } = await getCoveForOwner(uid, coveId);

  // 2. Prevent removing the owner
  if (memberId === coveData.createdBy) {
    const err = new Error('The cove owner cannot be removed.');
    err.statusCode = 400;
    throw err;
  }

  const memberDocRef = coveRef.collection('members').doc(memberId);
  const memberDocSnap = await memberDocRef.get();
  const legacyMembers = getLegacyMemberIds(coveData);
  const isMember = memberDocSnap.exists || legacyMembers.includes(memberId);

  if (!isMember) {
    const err = new Error('This user is not a member of this cove.');
    err.statusCode = 404;
    throw err;
  }

  const batch = db.batch();
  const nextMemberCount = Math.max(resolveMemberCount(coveData) - 1, 1);
  const coveUpdates = {
    memberCount: nextMemberCount,
  };

  if (legacyMembers.includes(memberId)) {
    coveUpdates.members = admin.firestore.FieldValue.arrayRemove(memberId);
  }

  batch.update(coveRef, coveUpdates);
  batch.delete(coveRef.collection('members_data').doc(memberId));
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
  const { coveRef, coveData } = await getCoveForMember(uid, coveId);

  // Get counts (using count aggregation where possible)
  const [membersSnap, quotesSnap, pinsSnap, humansSnap, capsulesSnap] = await Promise.all([
    coveRef.collection('members').count().get(),
    coveRef.collection('quotes').count().get(),
    coveRef.collection('pins').count().get(),
    coveRef.collection('humans').count().get(),
    coveRef.collection('timeCapsules').count().get(),
  ]);

  const memberCount = Math.max(membersSnap.data().count, resolveMemberCount(coveData));

  return {
    coveId,
    memberCount,
    quoteCount: quotesSnap.data().count,
    pinCount: pinsSnap.data().count,
    humanCount: humansSnap.data().count,
    capsuleCount: capsulesSnap.data().count,
  };
}

async function getTimeCapsuleStats(uid, coveId, capsuleId) {
  const { coveRef } = await getCoveForMember(uid, coveId);
  const { capsuleRef } = await getCapsuleRefForCove(coveRef, capsuleId);
  const entryCountSnapshot = await capsuleRef.collection('entries').count().get();

  return {
    capsuleId,
    entryCount: entryCountSnapshot.data().count,
  };
}

async function updateTimeCapsuleEmergencyStatus(uid, coveId, capsuleId, isEmergencyOpened) {
  const { db, coveRef, coveData } = await getCoveForOwner(uid, coveId);
  const { capsuleRef, capsuleData } = await getCapsuleRefForCove(coveRef, capsuleId);
  const nextEmergencyStatus = !!isEmergencyOpened;

  if (!!capsuleData.isEmergencyOpened === nextEmergencyStatus) {
    return {
      capsuleId,
      isEmergencyOpened: nextEmergencyStatus,
      notifiedDevices: 0,
    };
  }

  await capsuleRef.update({ isEmergencyOpened: nextEmergencyStatus });

  if (!nextEmergencyStatus) {
    return {
      capsuleId,
      isEmergencyOpened: false,
      notifiedDevices: 0,
    };
  }

  try {
    const { notifiedDevices } = await notifyCoveMembersCapsuleOpened(
      db,
      coveRef,
      coveData,
      coveId,
      capsuleId,
    );

    return {
      capsuleId,
      isEmergencyOpened: true,
      notifiedDevices,
    };
  } catch (error) {
    logger.error('Failed to fan out time capsule push notifications.', {
      coveId,
      capsuleId,
      error,
    });

    return {
      capsuleId,
      isEmergencyOpened: true,
      notifiedDevices: 0,
    };
  }
}

module.exports = {
  backfillLegacyMemberships,
  joinCove,
  deleteCove,
  removeMember,
  getCoveStats,
  getTimeCapsuleStats,
  updateTimeCapsuleEmergencyStatus,
};
