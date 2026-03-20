import { db } from '@/firebaseConfig';
import { deleteCoveCascade } from '@/utils/firestoreDelete';
import { generateJoinCode, isValidJoinCode, normalizeAvatarSeed } from '@/utils/security';
import {
    arrayUnion,
    collection,
    doc,
    getDoc,
    runTransaction,
    serverTimestamp,
    setDoc,
    updateDoc,
} from 'firebase/firestore';

interface CreateCoveInput {
    userId: string;
    name: string;
    description: string;
    avatarSeed: string;
}

const MAX_JOIN_CODE_ATTEMPTS = 6;

async function ensureMemberData(coveId: string, userId: string) {
    const memberRef = doc(db!, 'coves', coveId, 'members_data', userId);
    const existingMember = await getDoc(memberRef);
    const existingData = existingMember.exists() ? existingMember.data() : {};

    const payload: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
        role: typeof existingData.role === 'string' ? existingData.role : '',
        bio: typeof existingData.bio === 'string' ? existingData.bio : '',
    };

    if (!existingMember.exists() || !existingData.joinedAt) {
        payload.joinedAt = serverTimestamp();
    }

    await setDoc(memberRef, payload, { merge: true });
}

export async function createCoveWithJoinCode({ userId, name, description, avatarSeed }: CreateCoveInput) {
    if (!db) throw new Error('Database service is unavailable');
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_JOIN_CODE_ATTEMPTS; attempt += 1) {
        const joinCode = generateJoinCode();
        const coveRef = doc(collection(db!, 'coves'));
        const joinCodeRef = doc(db!, 'coveJoinCodes', joinCode);

        try {
            await runTransaction(db!, async (transaction) => {
                const existingJoinCode = await transaction.get(joinCodeRef);
                if (existingJoinCode.exists()) {
                    throw new Error('join-code-collision');
                }

                transaction.set(coveRef, {
                    name,
                    description,
                    avatarSeed: normalizeAvatarSeed(avatarSeed),
                    createdBy: userId,
                    members: [userId],
                    joinCode,
                    createdAt: serverTimestamp(),
                    isActive: true,
                });

                transaction.set(joinCodeRef, {
                    coveId: coveRef.id,
                    createdBy: userId,
                    createdAt: serverTimestamp(),
                });
            });

            await ensureMemberData(coveRef.id, userId);
            return { coveId: coveRef.id, joinCode };
        } catch (error: any) {
            if (error?.message === 'join-code-collision') {
                lastError = error;
                continue;
            }
            throw error;
        }
    }

    throw lastError || new Error('Unable to generate a unique invite code right now.');
}

export async function findCoveIdByJoinCode(joinCode: string) {
    if (!db || !isValidJoinCode(joinCode)) {
        return null;
    }

    const joinCodeSnap = await getDoc(doc(db!, 'coveJoinCodes', joinCode));
    if (!joinCodeSnap.exists()) {
        return null;
    }

    const data = joinCodeSnap.data();
    return typeof data.coveId === 'string' ? data.coveId : null;
}

export async function joinCoveById(coveId: string, userId: string) {
    if (!db) return;
    await updateDoc(doc(db!, 'coves', coveId), {
        members: arrayUnion(userId),
    });

    await ensureMemberData(coveId, userId);
}

export async function ensureCoveJoinCodeIndex(coveId: string, joinCode: string | undefined, createdBy: string | undefined) {
    if (!db || !joinCode || !createdBy || !isValidJoinCode(joinCode)) {
        return;
    }

    const joinCodeRef = doc(db!, 'coveJoinCodes', joinCode);

    await runTransaction(db!, async (transaction) => {
        const existing = await transaction.get(joinCodeRef);
        if (existing.exists()) {
            return;
        }

        transaction.set(joinCodeRef, {
            coveId,
            createdBy,
            createdAt: serverTimestamp(),
        });
    });
}

export async function deleteCoveWithJoinCode(coveId: string, joinCode?: string) {
    await deleteCoveCascade(coveId, joinCode);
}