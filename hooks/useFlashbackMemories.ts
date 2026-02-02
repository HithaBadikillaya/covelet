import { db } from '@/firebaseConfig';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
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
                    if (!createdAt?.seconds) return;
                    const dDate = new Date(createdAt.seconds * 1000);
                    if (
                        dDate.getMonth() === TARGET_MONTH &&
                        dDate.getDate() === TARGET_DATE &&
                        dDate.getFullYear() < CURRENT_YEAR
                    ) {
                        collected.push({
                            source,
                            id: d.id,
                            content: data[contentKey] ?? data.text ?? '',
                            title: titleKey ? data[titleKey] : undefined,
                            authorName: data.authorName,
                            year: dDate.getFullYear(),
                            createdAt,
                        });
                    }
                });
            };

            const qQuotes = query(base(['quotes']), orderBy('createdAt', 'desc'), limit(MAX_PER_SOURCE));
            addFromSnap(await getDocs(qQuotes), 'quote', 'content');

            const qPins = query(base(['pins']), orderBy('createdAt', 'desc'), limit(MAX_PER_SOURCE));
            addFromSnap(await getDocs(qPins), 'pin', 'description', 'title');

            const qHumans = query(base(['humans']), orderBy('createdAt', 'desc'), limit(MAX_PER_SOURCE));
            const snapHumans = await getDocs(qHumans);
            snapHumans.docs.forEach((d) => {
                const data = d.data();
                const createdAt = data.createdAt ?? null;
                if (!createdAt?.seconds) return;
                const dDate = new Date(createdAt.seconds * 1000);
                if (
                    dDate.getMonth() === TARGET_MONTH &&
                    dDate.getDate() === TARGET_DATE &&
                    dDate.getFullYear() < CURRENT_YEAR
                ) {
                    collected.push({
                        source: 'human',
                        id: d.id,
                        content: data.content ?? '',
                        authorName: data.isAnonymous ? 'Anonymous' : data.authorName,
                        year: dDate.getFullYear(),
                        createdAt,
                    });
                }
            });

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
