import { auth, db } from '@/firebaseConfig';
import { getRequiredUserProfile } from '@/utils/memberProfile';
import {
    clampPinPosition,
    normalizeMultilineText,
    normalizeSingleLineText,
    SECURITY_LIMITS,
} from '@/utils/security';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

export interface Pin {
    id: string;
    title: string;
    description: string;
    x: number;
    y: number;
    authorId: string;
    authorName?: string;
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
        x: number;
        y: number;
        mediaRef?: string;
    }) => Promise<void>;
    updatePin: (pinId: string, x: number, y: number) => Promise<void>;
    deletePin: (pinId: string) => Promise<void>;
}

export function usePins(coveId: string | undefined): UsePinsResult {
    const [pins, setPins] = useState<Pin[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!coveId || !db) {
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
                setPins(snap.docs.map((pinDoc) => ({ id: pinDoc.id, ...pinDoc.data() } as Pin)));
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error fetching pins:', err);
                setError('Failed to load board notes');
                setLoading(false);
            }
        );
        return () => unsub();
    }, [coveId]);

    const createPin = async (data: {
        title: string;
        description: string;
        x: number;
        y: number;
        mediaRef?: string;
    }) => {
        if (!coveId || !auth?.currentUser || !db) {
            return;
        }
        const uid = auth?.currentUser?.uid;
        if (!uid) return;

        const safeTitle = normalizeSingleLineText(data.title, SECURITY_LIMITS.pinTitle);
        const safeDescription = normalizeMultilineText(data.description, SECURITY_LIMITS.pinDescription);
        if (!safeTitle) {
            throw new Error('A note title is required.');
        }

        const user = auth?.currentUser;
        const profile = await getRequiredUserProfile(user.uid);
        const now = new Date();
        const position = clampPinPosition(data.x, data.y);
        await addDoc(collection(db!, 'coves', coveId, 'pins'), {
            title: safeTitle,
            description: safeDescription,
            x: position.x,
            y: position.y,
            authorId: user.uid,
            authorName: profile.name,
            createdAt: serverTimestamp(),
            day: now.getDate(),
            month: now.getMonth(),
            ...(data.mediaRef ? { mediaRef: normalizeSingleLineText(data.mediaRef, 240) } : {}),
        });
    };

    const updatePin = async (pinId: string, x: number, y: number) => {
        if (!coveId) return;
        const position = clampPinPosition(x, y);
        await updateDoc(doc(db!, 'coves', coveId, 'pins', pinId), position);
    };

    const deletePin = async (pinId: string) => {
        if (!coveId) return;
        await deleteDoc(doc(db!, 'coves', coveId, 'pins', pinId));
    };

    return { pins, loading, error, createPin, updatePin, deletePin };
}