import { logger } from '@/utils/logger';
import { db } from '@/firebaseConfig';
import { isValidJoinCode } from '@/utils/security';
import { apiDelete } from '@/services/api';
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    query,
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

async function deleteHumanStoryChildren(coveId: string, storyId: string) {
    if (!db) throw new Error('Database service is unavailable');
    await deleteCollectionInBatches(collection(db, 'coves', coveId, 'humans', storyId, 'likes'));
}

async function deleteTimeCapsuleChildren(coveId: string, capsuleId: string) {
    if (!db) throw new Error('Database service is unavailable');
    await deleteCollectionInBatches(collection(db, 'coves', coveId, 'timeCapsules', capsuleId, 'entries'));
}

export async function deleteQuoteCascade(coveId: string, quoteId: string) {
    if (!db) return;
    await deleteQuoteChildren(coveId, quoteId);
    await deleteDoc(doc(db, 'coves', coveId, 'quotes', quoteId));
}

export async function deleteCoveCascade(coveId: string, joinCode?: string) {
    logger.log(`Initiating server-side cascade delete for cove: ${coveId}`);
    try {
        const result = await apiDelete(`/coves/${coveId}`);
        if (result.error) {
            throw new Error(result.error.message || 'Failed to delete cove');
        }
        return result.data;
    } catch (err) {
        logger.error('Error in cascade delete:', err);
        throw err;
    }
}