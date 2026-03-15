import { auth, db } from '@/firebaseConfig';
import {
    addDoc,
    collection,
    collectionGroup,
    deleteDoc,
    doc,
    increment,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    where,
    writeBatch
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

export interface Quote {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    coveId: string;
    createdAt: { seconds: number; nanoseconds: number } | null;
    upvotesCount?: number;
}

export interface QuoteReply {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: { seconds: number; nanoseconds: number } | null;
}

export type QuoteSort = 'recent' | 'upvoted';

export interface UseQuotesResult {
    quotes: Quote[];
    loading: boolean;
    error: string | null;
    sort: QuoteSort;
    setSort: (s: QuoteSort) => void;
    createQuote: (content: string) => Promise<void>;
    deleteQuote: (quoteId: string) => Promise<void>;
    toggleUpvote: (quoteId: string) => Promise<void>;
    hasUpvoted: (quoteId: string) => boolean;
    getReplies: (quoteId: string) => QuoteReply[];
    subscribeReplies: (quoteId: string, onReplies: (replies: QuoteReply[]) => void) => () => void;
    addReply: (quoteId: string, content: string) => Promise<void>;
}

export function useQuotes(coveId: string | undefined): UseQuotesResult {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sort, setSort] = useState<QuoteSort>('recent');
    const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!coveId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const q = query(
            collection(db, 'coves', coveId, 'quotes'),
            orderBy(sort === 'recent' ? 'createdAt' : 'upvotesCount', 'desc')
        );
        const unsub = onSnapshot(
            q,
            (snap) => {
                setQuotes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quote)));
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error fetching quotes:', err);
                setError('Failed to load the wall');
                setLoading(false);
            }
        );
        return () => unsub();
    }, [coveId, sort]);

    useEffect(() => {
        if (!coveId || !auth.currentUser) {
            setUpvotedIds(new Set());
            return;
        }
        const uid = auth.currentUser.uid;

        // Optimized: Single listener for all upvotes by this user across all quotes.
        // This replaces the N individual listeners that were previously created.
        const q = query(
            collectionGroup(db, 'upvotes'),
            where('userId', '==', uid),
            where('coveId', '==', coveId)
        );

        const unsub = onSnapshot(q, (snap) => {
            const next = new Set<string>();
            snap.docs.forEach((doc) => {
                const data = doc.data();
                // Prefer the quoteId stored in binary, fallback to path parsing for old docs
                if (data.quoteId) {
                    next.add(data.quoteId);
                } else {
                    const parts = doc.ref.path.split('/');
                    if (parts[1] === coveId && parts[3]) {
                        next.add(parts[3]);
                    }
                }
            });
            setUpvotedIds(next);
        }, (err) => {
            // Note: If you see an error here about a missing index, 
            // click the link in the console to create it.
            console.error('Error in upvote listener:', err);
        });

        return () => unsub();
    }, [coveId]);

    const createQuote = async (content: string) => {
        if (!coveId || !auth.currentUser) throw new Error('You must be logged in');
        const user = auth.currentUser;
        const now = new Date();
        await addDoc(collection(db, 'coves', coveId, 'quotes'), {
            authorId: user.uid,
            authorName: user.displayName || 'Member',
            content: content.trim(),
            coveId,
            createdAt: serverTimestamp(),
            day: now.getDate(),
            month: now.getMonth(),
            upvotesCount: 0,
        });
    };

    const deleteQuote = async (quoteId: string) => {
        if (!coveId) return;
        await deleteDoc(doc(db, 'coves', coveId, 'quotes', quoteId));
    };

    const toggleUpvote = async (quoteId: string) => {
        if (!coveId || !auth.currentUser) return;
        const uid = auth.currentUser.uid;
        const upvoteRef = doc(db, 'coves', coveId, 'quotes', quoteId, 'upvotes', uid);
        const quoteRef = doc(db, 'coves', coveId, 'quotes', quoteId);
        const batch = writeBatch(db);
        if (upvotedIds.has(quoteId)) {
            batch.delete(upvoteRef);
            batch.update(quoteRef, { upvotesCount: increment(-1) });
        } else {
            batch.set(upvoteRef, { 
                userId: uid, 
                coveId: coveId,
                quoteId: quoteId,
                createdAt: serverTimestamp() 
            });
            batch.update(quoteRef, { upvotesCount: increment(1) });
        }
        await batch.commit();
    };

    const hasUpvoted = (quoteId: string) => upvotedIds.has(quoteId);

    const repliesCache: Record<string, QuoteReply[]> = {};
    const replyListeners: Record<string, (r: QuoteReply[]) => void> = {};

    const getReplies = (quoteId: string): QuoteReply[] => repliesCache[quoteId] ?? [];

    const subscribeReplies = (quoteId: string, onReplies: (replies: QuoteReply[]) => void): (() => void) => {
        if (!coveId) return () => { };
        replyListeners[quoteId] = onReplies;
        const q = query(
            collection(db, 'coves', coveId, 'quotes', quoteId, 'replies'),
            orderBy('createdAt', 'asc')
        );
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuoteReply));
            repliesCache[quoteId] = list;
            replyListeners[quoteId]?.(list);
        });
        return () => {
            unsub();
            delete replyListeners[quoteId];
        };
    };

    const addReply = async (quoteId: string, content: string) => {
        if (!coveId || !auth.currentUser) throw new Error('You must be logged in');
        const user = auth.currentUser;
        await addDoc(collection(db, 'coves', coveId, 'quotes', quoteId, 'replies'), {
            authorId: user.uid,
            authorName: user.displayName || 'Member',
            content: content.trim(),
            createdAt: serverTimestamp(),
        });
    };

    return {
        quotes,
        loading,
        error,
        sort,
        setSort,
        createQuote,
        deleteQuote,
        toggleUpvote,
        hasUpvoted,
        getReplies,
        subscribeReplies,
        addReply,
    };
}
