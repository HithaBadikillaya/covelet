import { auth, db } from '@/firebaseConfig';
import {
    collection,
    getDocs,
    limit,
    orderBy,
    query,
} from 'firebase/firestore';
import { useCallback, useState } from 'react';

export type RouletteMemoryType = 'quote' | 'pin' | 'human' | 'capsule';

export interface RouletteMemory {
    type: RouletteMemoryType;
    id: string;
    content: string;
    authorName?: string;
    title?: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    createdAt?: { seconds: number } | null;
}

const SAMPLE_SIZE = 50;

export interface UseMemoryRouletteResult {
    loading: boolean;
    error: string | null;
    memory: RouletteMemory | null;
    spin: () => Promise<void>;
}

/**
 * Fetches samples from quotes, pins, humans, and (if unlocked) time capsule entries,
 * then picks one at random. For large coves we sample recent items to avoid loading everything.
 */
export function useMemoryRoulette(coveId: string | undefined): UseMemoryRouletteResult {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [memory, setMemory] = useState<RouletteMemory | null>(null);

    const spin = useCallback(async () => {
        if (!coveId || !auth.currentUser) {
            setError('You must be in a cove to spin.');
            return;
        }
        setLoading(true);
        setError(null);
        setMemory(null);
        try {
            const pool: RouletteMemory[] = [];
            const base = (path: string[]) => collection(db, 'coves', coveId, ...path);

            // Quotes
            const qQuotes = query(base(['quotes']), orderBy('createdAt', 'desc'), limit(SAMPLE_SIZE));
            const snapQuotes = await getDocs(qQuotes);
            snapQuotes.docs.forEach((d) => {
                const data = d.data();
                pool.push({
                    type: 'quote',
                    id: d.id,
                    content: data.content || '',
                    authorName: data.authorName,
                    createdAt: data.createdAt ?? null,
                });
            });

            // Pins
            const qPins = query(base(['pins']), orderBy('createdAt', 'desc'), limit(SAMPLE_SIZE));
            const snapPins = await getDocs(qPins);
            snapPins.docs.forEach((d) => {
                const data = d.data();
                pool.push({
                    type: 'pin',
                    id: d.id,
                    content: data.description || '',
                    title: data.title,
                    authorName: data.authorName,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    createdAt: data.createdAt ?? null,
                });
            });

            // Humans
            const qHumans = query(base(['humans']), orderBy('createdAt', 'desc'), limit(SAMPLE_SIZE));
            const snapHumans = await getDocs(qHumans);
            snapHumans.docs.forEach((d) => {
                const data = d.data();
                pool.push({
                    type: 'human',
                    id: d.id,
                    content: data.content || '',
                    authorName: data.isAnonymous ? 'Anonymous' : data.authorName,
                    createdAt: data.createdAt ?? null,
                });
            });

            // Time capsule: get latest capsule and if unlocked, get entries
            const qCapsules = query(base(['timeCapsules']), orderBy('createdAt', 'desc'), limit(1));
            const snapCapsules = await getDocs(qCapsules);
            if (!snapCapsules.empty) {
                const cap = snapCapsules.docs[0];
                const capData = cap.data();
                const unlockAt = capData.unlockAt?.seconds ? capData.unlockAt.seconds * 1000 : 0;
                const isEmergency = capData.isEmergencyOpened === true;
                const now = Date.now();
                if (isEmergency || now >= unlockAt) {
                    const qEntries = query(
                        collection(db, 'coves', coveId, 'timeCapsules', cap.id, 'entries'),
                        orderBy('createdAt', 'desc'),
                        limit(SAMPLE_SIZE)
                    );
                    const snapEntries = await getDocs(qEntries);
                    snapEntries.docs.forEach((d) => {
                        const data = d.data();
                        pool.push({
                            type: 'capsule',
                            id: d.id,
                            content: data.text || '',
                            authorName: data.authorName,
                            createdAt: data.createdAt ?? null,
                        });
                    });
                }
            }

            if (pool.length === 0) {
                setError('No memories in this cove yet. Add some first!');
                setLoading(false);
                return;
            }
            const chosen = pool[Math.floor(Math.random() * pool.length)];
            setMemory(chosen);
        } catch (err: any) {
            console.error('Roulette error:', err);
            setError(err.message || 'Failed to spin');
        } finally {
            setLoading(false);
        }
    }, [coveId]);

    return { loading, error, memory, spin };
}
