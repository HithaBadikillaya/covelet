import { auth, db } from '@/firebaseConfig';
import { apiPost } from '@/services/api';
import { deleteCoveCascade } from '@/utils/firestoreDelete';
import { generateJoinCode, isValidJoinCode, normalizeAvatarSeed } from '@/utils/security';
import {
    collection,
    doc,
    getDoc,
    runTransaction,
    serverTimestamp,
    setDoc,
} from 'firebase/firestore';

interface CreateCoveInput {
    userId: string;
    name: string;
    description: string;
    avatarSeed: string;
}

const MAX_JOIN_CODE_ATTEMPTS = 6;

async function ensureMemberData(coveId: string, userId: string) {
    if (!db) throw new Error('Database service is unavailable');
    const memberRef = doc(db, 'coves', coveId, 'members_data', userId);
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
    const database = db; // guaranteed non-null from here
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_JOIN_CODE_ATTEMPTS; attempt += 1) {
        const joinCode = generateJoinCode();
        const coveRef = doc(collection(database, 'coves'));
        const joinCodeRef = doc(database, 'coveJoinCodes', joinCode);
        const memberRef = doc(database, 'coves', coveRef.id, 'members', userId);

        try {
            await runTransaction(database, async (transaction) => {
                const existingJoinCode = await transaction.get(joinCodeRef);
                if (existingJoinCode.exists()) {
                    throw new Error('join-code-collision');
                }

                transaction.set(coveRef, {
                    name,
                    description,
                    avatarSeed: normalizeAvatarSeed(avatarSeed),
                    createdBy: userId,
                    joinCode,
                    createdAt: serverTimestamp(),
                    isActive: true,
                    memberCount: 1,
                });

                transaction.set(joinCodeRef, {
                    coveId: coveRef.id,
                    createdBy: userId,
                    createdAt: serverTimestamp(),
                });

                transaction.set(memberRef, {
                    userId,
                    joinedAt: serverTimestamp(),
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

export async function joinCoveByCode(joinCode: string) {
    const result = await apiPost<{ coveId: string; joined: boolean; alreadyMember: boolean }>(
        '/coves/join',
        { joinCode },
    );

    if (result.error) {
        const error = new Error(result.error.message || 'Failed to join cove.');
        (error as Error & { code?: string }).code = result.error.code;
        throw error;
    }

    return result.data;
}

export async function ensureCoveJoinCodeIndex(coveId: string, joinCode: string | undefined, createdBy: string | undefined) {
    if (!db || !joinCode || !createdBy || !isValidJoinCode(joinCode) || auth?.currentUser?.uid !== createdBy) {
        return;
    }

    const database = db;
    const joinCodeRef = doc(database, 'coveJoinCodes', joinCode);

    await runTransaction(database, async (transaction) => {
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
