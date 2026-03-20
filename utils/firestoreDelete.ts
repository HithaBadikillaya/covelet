import { db } from '@/firebaseConfig';
import { isValidJoinCode } from '@/utils/security';
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

        const batch = writeBatch(db!);
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
    await deleteCollectionInBatches(collection(db!, 'coves', coveId, 'quotes', quoteId, 'replies'));
    await deleteCollectionInBatches(collection(db!, 'coves', coveId, 'quotes', quoteId, 'upvotes'));
}

async function deleteHumanStoryChildren(coveId: string, storyId: string) {
    await deleteCollectionInBatches(collection(db!, 'coves', coveId, 'humans', storyId, 'likes'));
}

async function deleteTimeCapsuleChildren(coveId: string, capsuleId: string) {
    await deleteCollectionInBatches(collection(db!, 'coves', coveId, 'timeCapsules', capsuleId, 'entries'));
}

export async function deleteQuoteCascade(coveId: string, quoteId: string) {
    if (!db) return;
    await deleteQuoteChildren(coveId, quoteId);
    await deleteDoc(doc(db!, 'coves', coveId, 'quotes', quoteId));
}

export async function deleteCoveCascade(coveId: string, joinCode?: string) {
    if (!db) return;
    await deleteCollectionInBatches(
        collection(db!, 'coves', coveId, 'quotes'),
        async (quoteSnapshot) => {
            await deleteQuoteChildren(coveId, quoteSnapshot.id);
        }
    );

    await deleteCollectionInBatches(
        collection(db!, 'coves', coveId, 'humans'),
        async (storySnapshot) => {
            await deleteHumanStoryChildren(coveId, storySnapshot.id);
        }
    );

    await deleteCollectionInBatches(
        collection(db!, 'coves', coveId, 'timeCapsules'),
        async (capsuleSnapshot) => {
            await deleteTimeCapsuleChildren(coveId, capsuleSnapshot.id);
        }
    );

    await deleteCollectionInBatches(collection(db!, 'coves', coveId, 'pins'));
    await deleteCollectionInBatches(collection(db!, 'coves', coveId, 'members_data'));

    const batch = writeBatch(db);
    batch.delete(doc(db!, 'coves', coveId));

    if (joinCode && isValidJoinCode(joinCode)) {
        batch.delete(doc(db!, 'coveJoinCodes', joinCode));
    }

    await batch.commit();
}