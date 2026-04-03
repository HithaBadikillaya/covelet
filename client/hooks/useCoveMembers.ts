import { logger } from '@/utils/logger';
import { auth, db } from '@/firebaseConfig';
import { getLegacyMemberIds, migrateLegacyCoveMembers } from '@/utils/coveMembership';
import { getFallbackAvatarSeed } from '@/utils/memberProfile';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export interface Member {
    id: string;
    name: string;
    avatarSeed: string;
    role?: string;
    bio?: string;
    joinedAt?: { seconds: number } | null;
}

export function useCoveMembers(coveId: string | undefined) {
    const [members, setMembers] = useState<Member[]>([]);
    const [coveAvatarSeed, setCoveAvatarSeed] = useState<string>('');
    const [ownerId, setOwnerId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!coveId || !db) {
            setMembers([]);
            setCoveAvatarSeed('');
            setOwnerId('');
            setError(!db ? 'Database service is unavailable.' : null);
            setLoading(false);
            return;
        }

        // db is guaranteed non-null from here
        const database = db;
        const currentUserId = auth?.currentUser?.uid || '';
        let memberIds: string[] = [];
        let memberJoinedAtMap: Record<string, { seconds: number } | null> = {};
        let memberDataMap: Record<string, any> = {};
        let unsubscribeMembersData: (() => void) | null = null;
        let unsubscribeMembers: (() => void) | null = null;
        let active = true;
        let requestVersion = 0;

        const syncMembers = async () => {
            const version = ++requestVersion;

            try {
                const userSnaps = await Promise.all(
                    memberIds.map((id) => getDoc(doc(database, 'users', id)))
                );

                if (!active || version !== requestVersion) return;

                const fullMembers: Member[] = memberIds.map((id, index) => {
                    const user = userSnaps[index]?.data() || {};
                    const extra = memberDataMap[id] || {};
                    const joinedAt = extra.joinedAt || memberJoinedAtMap[id] || null;

                    return {
                        id,
                        name: typeof user.name === 'string' && user.name.trim() ? user.name.trim() : 'Member',
                        avatarSeed: getFallbackAvatarSeed(id, typeof user.avatarSeed === 'string' ? user.avatarSeed : undefined),
                        role: extra.role || '',
                        bio: extra.bio || '',
                        joinedAt,
                    };
                });

                setMembers(fullMembers);
                setError(null);
            } catch (err) {
                logger.error('Error fetching users:', err);
                if (!active) return;
                setError('Failed to load member profiles');
            } finally {
                if (active && version === requestVersion) {
                    setLoading(false);
                }
            }
        };

        const coveRef = doc(database, 'coves', coveId);
        const unsubscribeCove = onSnapshot(
            coveRef,
            (coveSnap) => {
                if (!coveSnap.exists()) {
                    setError('Cove not found');
                    setMembers([]);
                    setOwnerId('');
                    setLoading(false);
                    return;
                }

                const coveData = coveSnap.data();
                const legacyMemberIds = getLegacyMemberIds(coveData.members);

                setCoveAvatarSeed(coveData.avatarSeed || coveId);
                setOwnerId(coveData.createdBy || '');
                setLoading(true);

                void migrateLegacyCoveMembers({
                    coveId,
                    currentUserId,
                    createdBy: coveData.createdBy,
                    memberCount: coveData.memberCount,
                    legacyMembers: coveData.members,
                });

                if (unsubscribeMembers) unsubscribeMembers();
                if (unsubscribeMembersData) unsubscribeMembersData();

                const maybeSyncMembers = () => {
                    const mergedIds = Array.from(new Set([
                        ...memberIds,
                        ...legacyMemberIds,
                    ]));

                    memberIds = mergedIds;

                    if (mergedIds.length === 0) {
                        setMembers([]);
                        setLoading(false);
                        return;
                    }

                    void syncMembers();
                };

                const membersRef = collection(database, 'coves', coveId, 'members');
                unsubscribeMembers = onSnapshot(
                    membersRef,
                    (membersSnap) => {
                        memberIds = membersSnap.docs.map((snap) => snap.id);
                        memberJoinedAtMap = membersSnap.docs.reduce<Record<string, { seconds: number } | null>>((acc, snap) => {
                            acc[snap.id] = snap.data().joinedAt || null;
                            return acc;
                        }, {});

                        maybeSyncMembers();
                    },
                    (err) => {
                        if (err?.code === 'permission-denied' || err?.code === 'not-found') {
                            if (!active) return;
                            setMembers([]);
                            setLoading(false);
                            setError('Cove not found');
                            return;
                        }

                        logger.error('Error fetching cove members:', err);
                        if (!active) return;
                        setError('Failed to load cove membership');
                        setLoading(false);
                    }
                );

                const membersDataRef = collection(database, 'coves', coveId, 'members_data');
                unsubscribeMembersData = onSnapshot(
                    membersDataRef,
                    (dataSnap) => {
                        memberDataMap = {};
                        dataSnap.forEach((snap) => {
                            memberDataMap[snap.id] = snap.data();
                        });

                        maybeSyncMembers();
                    },
                    (err) => {
                        if (err?.code === 'permission-denied' || err?.code === 'not-found') {
                            if (!active) return;
                            memberDataMap = {};
                            setLoading(false);
                            return;
                        }

                        logger.error('Error fetching cove member data:', err);
                        if (!active) return;
                        setError('Failed to load member details');
                        setLoading(false);
                    }
                );
            },
            (err) => {
                if (err?.code === 'permission-denied' || err?.code === 'not-found') {
                    if (!active) return;
                    setMembers([]);
                    setOwnerId('');
                    setError('Cove not found');
                    setLoading(false);
                    return;
                }

                logger.error('Error fetching cove:', err);
                if (!active) return;
                setError('Failed to load cove members');
                setLoading(false);
            }
        );

        return () => {
            active = false;
            unsubscribeCove();
            if (unsubscribeMembers) unsubscribeMembers();
            if (unsubscribeMembersData) unsubscribeMembersData();
        };
    }, [coveId, auth?.currentUser?.uid]);

    return { members, coveAvatarSeed, ownerId, loading, error };
}
