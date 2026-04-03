import { logger } from '@/utils/logger';
import { db } from '@/firebaseConfig';
import { apiPost } from '@/services/api';
import {
    deleteField,
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
    updateDoc,
} from 'firebase/firestore';

export function getLegacyMemberIds(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return Array.from(
        new Set(
            value.filter((memberId): memberId is string => typeof memberId === 'string' && memberId.trim().length > 0),
        ),
    );
}

export function resolveMemberCount(memberCount: unknown, legacyMembers?: unknown): number {
    const legacyCount = getLegacyMemberIds(legacyMembers).length;
    return Math.max(typeof memberCount === 'number' && Number.isFinite(memberCount) ? memberCount : 0, legacyCount);
}

export async function ensureCoveMemberRecord(coveId: string, userId: string) {
    if (!db) {
        throw new Error('Database service is unavailable');
    }

    const memberRef = doc(db, 'coves', coveId, 'members', userId);
    const existingMember = await getDoc(memberRef);

    if (existingMember.exists()) {
        return;
    }

    const legacyMemberData = await getDoc(doc(db, 'coves', coveId, 'members_data', userId));
    const legacyJoinedAt = legacyMemberData.data()?.joinedAt;

    await setDoc(memberRef, {
        userId,
        joinedAt: legacyJoinedAt || serverTimestamp(),
    });
}

export async function backfillSelfMembershipsFromLegacy(userId: string) {
    if (!userId) {
        return 0;
    }

    const response = await apiPost<{ backfilledCount?: number; migratedCoves?: number }>(
        '/coves/backfill-memberships',
        {},
    );

    if (response.error) {
        logger.warn('Unable to backfill legacy Cove memberships.', {
            userId,
            code: response.error.code,
            message: response.error.message,
        });
        return 0;
    }

    return response.data?.backfilledCount || 0;
}

interface MigrateLegacyCoveMembersInput {
    coveId: string;
    currentUserId: string;
    createdBy?: string;
    memberCount?: number;
    legacyMembers?: unknown;
}

export async function migrateLegacyCoveMembers({
    coveId,
    currentUserId,
    createdBy,
    memberCount,
    legacyMembers,
}: MigrateLegacyCoveMembersInput) {
    if (!db || !coveId || !currentUserId) {
        return;
    }

    const legacyMemberIds = getLegacyMemberIds(legacyMembers);
    if (legacyMemberIds.length === 0) {
        return;
    }

    const targetMemberIds = currentUserId === createdBy
        ? legacyMemberIds
        : legacyMemberIds.filter((memberId) => memberId === currentUserId);

    await Promise.allSettled(
        targetMemberIds.map((memberId) => ensureCoveMemberRecord(coveId, memberId)),
    );

    if (currentUserId !== createdBy) {
        return;
    }

    const nextMemberCount = resolveMemberCount(memberCount, legacyMemberIds);

    try {
        await updateDoc(doc(db, 'coves', coveId), {
            memberCount: nextMemberCount,
            members: deleteField(),
        });
    } catch (error) {
        logger.warn('Unable to finish legacy member migration for cove.', { coveId, error });
    }
}
