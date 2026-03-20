import { db } from '@/firebaseConfig';
import {
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    where,
} from 'firebase/firestore';
import { useCallback, useState } from 'react';

export type FlashbackSource = 'quote' | 'pin' | 'human' | 'capsule';

export interface FlashbackMemory {
    source: FlashbackSource;
    id: string;
    content: string;
    title?: string;
    authorName?: string;
    year: number;
    createdAt: { seconds: number } | null;
}

const MAX_PER_SOURCE = 200;
const MAX_CAPSULES_TO_SCAN = 24;
const MAX_ENTRIES_PER_CAPSULE = 25;
const today = new Date();
const TARGET_MONTH = today.getMonth();
const TARGET_DATE = today.getDate();
const CURRENT_YEAR = today.getFullYear();

export function useFlashbackMemories(coveId: string | undefined) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [memories, setMemories] = useState<FlashbackMemory[]>([]);

    const fetchFlashbacks = useCallback(async () => {
        if (!coveId || !db) {
            setError(!db ? 'Database service is unavailable.' : null);
            return;
        }
        setLoading(true);
        setError(null);
        setMemories([]);

        try {
            const collected: FlashbackMemory[] = [];
            const base = (path: string[]) => collection(db!, 'coves', coveId, ...path);

            const addMemory = (
                source: FlashbackSource,
                id: string,
                data: Record<string, any>,
                contentKey: string,
                titleKey?: string,
                fallbackAuthorName?: string
            ) => {
                const createdAt = data.createdAt ?? null;
                if (createdAt?.seconds) {
                    const createdDate = new Date(createdAt.seconds * 1000);
                    if (createdDate.getFullYear() >= CURRENT_YEAR) {
                        return;
                    }
                }

                collected.push({
                    source,
                    id,
                    content: data[contentKey] ?? data.text ?? '',
                    title: titleKey ? data[titleKey] : undefined,
                    authorName: fallbackAuthorName ?? data.authorName,
                    year: data.year ?? (createdAt?.seconds ? new Date(createdAt.seconds * 1000).getFullYear() : CURRENT_YEAR - 1),
                    createdAt,
                });
            };

            const commonFilters = [
                where('day', '==', TARGET_DATE),
                where('month', '==', TARGET_MONTH),
                orderBy('createdAt', 'desc'),
                limit(MAX_PER_SOURCE),
            ];

            const sourceQueries = [
                {
                    source: 'quote' as const,
                    run: async () => {
                        const snap = await getDocs(query(base(['quotes']), ...commonFilters));
                        snap.docs.forEach((docSnap) => addMemory('quote', docSnap.id, docSnap.data(), 'content'));
                    },
                },
                {
                    source: 'pin' as const,
                    run: async () => {
                        const snap = await getDocs(query(base(['pins']), ...commonFilters));
                        snap.docs.forEach((docSnap) => addMemory('pin', docSnap.id, docSnap.data(), 'description', 'title'));
                    },
                },
                {
                    source: 'human' as const,
                    run: async () => {
                        const snap = await getDocs(query(base(['humans']), ...commonFilters));
                        snap.docs.forEach((docSnap) => {
                            const data = docSnap.data();
                            addMemory(
                                'human',
                                docSnap.id,
                                data,
                                'content',
                                undefined,
                                data.isAnonymous ? 'Anonymous' : data.authorName
                            );
                        });
                    },
                },
                {
                    source: 'capsule' as const,
                    run: async () => {
                        const capsuleSnap = await getDocs(
                            query(base(['timeCapsules']), orderBy('createdAt', 'desc'), limit(MAX_CAPSULES_TO_SCAN))
                        );

                        const entryFetches = capsuleSnap.docs
                            .filter((capsuleDoc) => {
                                const capsule = capsuleDoc.data();
                                const unlockAtMs = capsule.unlockAt?.seconds ? capsule.unlockAt.seconds * 1000 : 0;
                                return capsule.isEmergencyOpened === true || unlockAtMs <= Date.now();
                            })
                            .map(async (capsuleDoc) => {
                                const entrySnap = await getDocs(
                                    query(
                                        collection(db!, 'coves', coveId, 'timeCapsules', capsuleDoc.id, 'entries'),
                                        where('day', '==', TARGET_DATE),
                                        where('month', '==', TARGET_MONTH),
                                        orderBy('createdAt', 'desc'),
                                        limit(MAX_ENTRIES_PER_CAPSULE)
                                    )
                                );

                                entrySnap.docs.forEach((docSnap) => addMemory('capsule', docSnap.id, docSnap.data(), 'text'));
                            });

                        await Promise.all(entryFetches);
                    },
                },
            ];

            const results = await Promise.allSettled(sourceQueries.map((item) => item.run()));
            const failedSources = results
                .map((result, index) => ({ result, source: sourceQueries[index].source }))
                .filter((entry) => entry.result.status === 'rejected');

            failedSources.forEach((entry) => {
                console.error(`Flashback ${entry.source} source failed:`, (entry.result as PromiseRejectedResult).reason);
            });

            collected.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
            setMemories(collected);

            if (failedSources.length === sourceQueries.length) {
                setError('Failed to load flashbacks');
            } else if (failedSources.length > 0) {
                setError('Some memories could not be loaded, but flashbacks are still available.');
            }
        } catch (err: any) {
            console.error('Flashback error:', err);
            setError(err.message || 'Failed to load flashbacks');
        } finally {
            setLoading(false);
        }
    }, [coveId]);

    return { loading, error, memories, fetchFlashbacks };
}