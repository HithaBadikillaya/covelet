import { db } from '@/firebaseConfig';
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

        let unsubscribeMembersData: (() => void) | null = null;
        let active = true;
        let requestVersion = 0;

        const syncMembers = async (memberIds: string[], dataMap: Record<string, any>) => {
            const version = ++requestVersion;

            try {
                const userSnaps = await Promise.all(
                    memberIds.map((id) => getDoc(doc(db!, 'users', id)))
                );

                if (!active || version !== requestVersion) return;

                const fullMembers: Member[] = memberIds.map((id, index) => {
                    const user = userSnaps[index]?.data() || {};
                    const extra = dataMap[id] || {};

                    return {
                        id,
                        name: typeof user.name === 'string' && user.name.trim() ? user.name.trim() : 'Member',
                        avatarSeed: getFallbackAvatarSeed(id, typeof user.avatarSeed === 'string' ? user.avatarSeed : undefined),
                        role: extra.role || '',
                        bio: extra.bio || '',
                        joinedAt: extra.joinedAt || null,
                    };
                });

                setMembers(fullMembers);
                setError(null);
            } catch (err) {
                console.error('Error fetching users:', err);
                if (!active) return;
                setError('Failed to load member profiles');
            } finally {
                if (active && version === requestVersion) {
                    setLoading(false);
                }
            }
        };

        const coveRef = doc(db!, 'coves', coveId);
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
                const memberIds = Array.isArray(coveData.members) ? coveData.members : [];

                setCoveAvatarSeed(coveData.avatarSeed || coveId);
                setOwnerId(coveData.createdBy || '');
                setLoading(true);

                if (unsubscribeMembersData) unsubscribeMembersData();

                if (memberIds.length === 0) {
                    setMembers([]);
                    setLoading(false);
                    return;
                }

                const membersDataRef = collection(db!, 'coves', coveId, 'members_data');
                unsubscribeMembersData = onSnapshot(
                    membersDataRef,
                    (dataSnap) => {
                        const dataMap: Record<string, any> = {};
                        dataSnap.forEach((snap) => {
                            dataMap[snap.id] = snap.data();
                        });

                        void syncMembers(memberIds, dataMap);
                    },
                    (err) => {
                        console.error('Error fetching cove member data:', err);
                        if (!active) return;
                        setError('Failed to load member details');
                        setLoading(false);
                    }
                );
            },
            (err) => {
                console.error('Error fetching cove:', err);
                if (!active) return;
                setError('Failed to load cove members');
                setLoading(false);
            }
        );

        return () => {
            active = false;
            unsubscribeCove();
            if (unsubscribeMembersData) unsubscribeMembersData();
        };
    }, [coveId]);

    return { members, coveAvatarSeed, ownerId, loading, error };
}