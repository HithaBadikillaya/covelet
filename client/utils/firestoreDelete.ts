import { logger } from '@/utils/logger';
import { auth, db } from '@/firebaseConfig';
import { getLegacyMemberIds, resolveMemberCount } from '@/utils/coveMembership';
import { isValidJoinCode } from '@/utils/security';
import { apiDelete } from '@/services/api';
import {
    arrayRemove,
    collection,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    limit,
    query,
    updateDoc,
    writeBatch,
    type CollectionReference,
    type DocumentData,
    type QueryDocumentSnapshot,
} from 'firebase/firestore';

const DELETE_BATCH_SIZE = 200;

async function deleteCollectionInBatches(
    collectionRef: CollectionReference<DocumentData>,
    beforeDelete?: (snapshot: QueryDocumentSnapshot<DocumentData>) => Promise<void>
) {
    if (!db) throw new Error('Database service is unavailable');
    while (true) {
        const snapshot = await getDocs(query(collectionRef, limit(DELETE_BATCH_SIZE)));
        if (snapshot.empty) {
            return;
        }

        for (const documentSnapshot of snapshot.docs) {
            if (beforeDelete) {
                await beforeDelete(documentSnapshot);
            }
        }

        const batch = writeBatch(db);
        snapshot.docs.forEach((documentSnapshot) => {
            batch.delete(documentSnapshot.ref);
        });
        await batch.commit();

        if (snapshot.size < DELETE_BATCH_SIZE) {
            return;
        }
    }
}

async function deleteQuoteChildren(coveId: string, quoteId: string) {
    if (!db) throw new Error('Database service is unavailable');
    await deleteCollectionInBatches(collection(db, 'coves', coveId, 'quotes', quoteId, 'replies'));
    await deleteCollectionInBatches(collection(db, 'coves', coveId, 'quotes', quoteId, 'upvotes'));
}

export async function deleteQuoteCascade(coveId: string, quoteId: string) {
    if (!db) return;
    await deleteQuoteChildren(coveId, quoteId);
    await deleteDoc(doc(db, 'coves', coveId, 'quotes', quoteId));
}

export async function deleteCoveCascade(coveId: string, joinCode?: string) {
    logger.log(`Initiating server-side cascade delete for cove: ${coveId}`);
    const result = await apiDelete(`/coves/${coveId}`);

    if (result.error) {
        if (result.error.code !== 'NETWORK_ERROR') {
            throw new Error(result.error.message || 'Failed to delete cove');
        }

        logger.warn('API unavailable for cascade delete. Falling back to client Firestore delete.');
        return deleteCoveCascadeLocally(coveId, joinCode);
    }

    logger.log(`Server-side cascade delete confirmed for cove: ${coveId}. Redirecting...`);
    return result.data;
}

async function deleteCoveCascadeLocally(coveId: string, joinCode?: string) {
    if (!db) {
        throw new Error('Database service is unavailable');
    }

    const currentUserId = auth?.currentUser?.uid;
    if (!currentUserId) {
        throw new Error('You must be signed in to delete a cove.');
    }

    const coveRef = doc(db, 'coves', coveId);
    const coveSnapshot = await getDoc(coveRef);

    if (!coveSnapshot.exists()) {
        return { deleted: true };
    }

    const coveData = coveSnapshot.data();
    if (typeof coveData.createdBy !== 'string' || coveData.createdBy !== currentUserId) {
        throw new Error('Only the cove owner can delete this cove.');
    }

    const resolvedJoinCode =
        joinCode ||
        (typeof coveData.joinCode === 'string' ? coveData.joinCode : undefined);

    // Delete cove doc and join code atomically. Per Firestore rules:
    //   - cove doc: allow delete if isCoveOwner ✓
    //   - coveJoinCodes: allow delete if resource.data.coveId owner ✓
    // Subcollections (timeCapsule entries, members, etc.) may have restricted
    // list permissions (e.g., locked capsule entries). We skip those here;
    // once the cove doc is deleted the cove disappears from all dashboards.
    // Server-side cleanup handles orphaned subcollections when available.
    const batch = writeBatch(db);
    batch.delete(coveRef);

    if (resolvedJoinCode && isValidJoinCode(resolvedJoinCode)) {
        batch.delete(doc(db, 'coveJoinCodes', resolvedJoinCode));
    }

    await batch.commit();

    return { deleted: true };
}

export async function removeMemberFromCove(coveId: string, memberId: string) {
    const result = await apiDelete(`/coves/${coveId}/members/${memberId}`);

    if (result.error) {
        if (result.error.code !== 'NETWORK_ERROR') {
            throw new Error(result.error.message || 'Failed to remove member');
        }

        logger.warn('API unavailable for member removal. Falling back to client Firestore update.');
        return removeMemberFromCoveLocally(coveId, memberId);
    }

    return result.data;
}

async function removeMemberFromCoveLocally(coveId: string, memberId: string) {
    if (!db) {
        throw new Error('Database service is unavailable');
    }

    const coveRef = doc(db, 'coves', coveId);
    const coveSnapshot = await getDoc(coveRef);
    if (!coveSnapshot.exists()) {
        return { removed: true };
    }
    const coveData = coveSnapshot.exists() ? coveSnapshot.data() : {};
    const legacyMemberIds = getLegacyMemberIds(coveData.members);
    const nextMemberCount = Math.max(resolveMemberCount(coveData.memberCount, legacyMemberIds) - 1, 1);

    await updateDoc(coveRef, {
        memberCount: nextMemberCount,
        ...(legacyMemberIds.includes(memberId) ? { members: arrayRemove(memberId) } : {}),
    });

    await Promise.all([
        deleteDoc(doc(db, 'coves', coveId, 'members_data', memberId)),
        deleteDoc(doc(db, 'coves', coveId, 'members', memberId)),
    ]);

    return { removed: true };
}
