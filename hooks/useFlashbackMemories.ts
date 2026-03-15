import { db } from '@/firebaseConfig';
import { collection, collectionGroup, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
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
const today = new Date();
const TARGET_MONTH = today.getMonth();
const TARGET_DATE = today.getDate();
const CURRENT_YEAR = today.getFullYear();

/**
 * Fetches recent memories from each source, then filters client-side by same month/day as today (past years only).
 * Avoids composite indexes; scales by limiting per-source fetch size.
 */
export function useFlashbackMemories(coveId: string | undefined) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [memories, setMemories] = useState<FlashbackMemory[]>([]);

    const fetchFlashbacks = useCallback(async () => {
        if (!coveId) return;
        setLoading(true);
        setError(null);
        setMemories([]);
        try {
            const collected: FlashbackMemory[] = [];
            const base = (path: string[]) => collection(db, 'coves', coveId, ...path);

            const addFromSnap = (
                snap: import('firebase/firestore').QuerySnapshot<import('firebase/firestore').DocumentData>,
                source: FlashbackSource,
                contentKey: string,
                titleKey?: string
            ) => {
                snap.docs.forEach((d) => {
                    const data = d.data();
                    const createdAt = data.createdAt ?? null;
                    // Filter past years only (current year memories aren't "flashbacks")
                    if (createdAt?.seconds) {
                        const dDate = new Date(createdAt.seconds * 1000);
                        if (dDate.getFullYear() >= CURRENT_YEAR) return;
                    }

                    collected.push({
                        source,
                        id: d.id,
                        content: data[contentKey] ?? data.text ?? '',
                        title: titleKey ? data[titleKey] : undefined,
                        authorName: data.authorName,
                        year: data.year ?? (data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).getFullYear() : CURRENT_YEAR - 1),
                        createdAt: data.createdAt ?? null,
                    });
                });
            };

            // Queries are now server-side filtered by day and month
            const commonFilters = [
                where('day', '==', TARGET_DATE),
                where('month', '==', TARGET_MONTH),
                orderBy('createdAt', 'desc'),
                limit(MAX_PER_SOURCE)
            ];

            const qQuotes = query(base(['quotes']), ...commonFilters);
            const qPins = query(base(['pins']), ...commonFilters);
            const qHumans = query(base(['humans']), ...commonFilters);

            // Capsule entries are nested, so we use collectionGroup
            const qCapsules = query(
                collectionGroup(db, 'entries'),
                where('coveId', '==', coveId),
                ...commonFilters
            );

            // Fetch all in parallel
            const [snapQuotes, snapPins, snapHumans, snapCapsules] = await Promise.all([
                getDocs(qQuotes),
                getDocs(qPins),
                getDocs(qHumans),
                getDocs(qCapsules)
            ]);

            addFromSnap(snapQuotes, 'quote', 'content');
            addFromSnap(snapPins, 'pin', 'description', 'title');
            
            // Special handling for humans (anonymity)
            snapHumans.docs.forEach((d) => {
                const data = d.data();
                if (data.year && data.year >= CURRENT_YEAR) return;
                collected.push({
                    source: 'human',
                    id: d.id,
                    content: data.content ?? '',
                    authorName: data.isAnonymous ? 'Anonymous' : data.authorName,
                    year: data.year ?? (data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).getFullYear() : CURRENT_YEAR - 1),
                    createdAt: data.createdAt ?? null,
                });
            });

            addFromSnap(snapCapsules, 'capsule', 'text');

            collected.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
            setMemories(collected);
        } catch (err: any) {
            console.error('Flashback error:', err);
            setError(err.message || 'Failed to load flashbacks');
        } finally {
            setLoading(false);
        }
    }, [coveId]);

    return { loading, error, memories, fetchFlashbacks };
}
