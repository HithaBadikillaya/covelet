import { auth, db } from '@/firebaseConfig';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

export interface Pin {
    id: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    authorId: string;
    createdAt: { seconds: number; nanoseconds: number } | null;
    mediaRef?: string;
}

export interface UsePinsResult {
    pins: Pin[];
    loading: boolean;
    error: string | null;
    createPin: (data: {
        title: string;
        description: string;
        latitude: number;
        longitude: number;
        mediaRef?: string;
    }) => Promise<void>;
    deletePin: (pinId: string) => Promise<void>;
}

export function usePins(coveId: string | undefined): UsePinsResult {
    const [pins, setPins] = useState<Pin[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!coveId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const q = query(
            collection(db, 'coves', coveId, 'pins'),
            orderBy('createdAt', 'desc')
        );
        const unsub = onSnapshot(
            q,
            (snap) => {
                setPins(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pin)));
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error fetching pins:', err);
                setError('Failed to load map memories');
                setLoading(false);
            }
        );
        return () => unsub();
    }, [coveId]);

    const createPin = async (data: {
        title: string;
        description: string;
        latitude: number;
        longitude: number;
        mediaRef?: string;
    }) => {
        if (!coveId || !auth.currentUser) throw new Error('You must be logged in');
        const user = auth.currentUser;
        await addDoc(collection(db, 'coves', coveId, 'pins'), {
            title: data.title.trim(),
            description: data.description.trim(),
            latitude: data.latitude,
            longitude: data.longitude,
            authorId: user.uid,
            createdAt: serverTimestamp(),
            ...(data.mediaRef && { mediaRef: data.mediaRef }),
        });
    };

    const deletePin = async (pinId: string) => {
        if (!coveId) return;
        await deleteDoc(doc(db, 'coves', coveId, 'pins', pinId));
    };

    return { pins, loading, error, createPin, deletePin };
}
