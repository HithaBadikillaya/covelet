import { auth, db } from '@/firebaseConfig';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    increment,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    writeBatch,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

export interface Quote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  coveId: string;
  createdAt: Timestamp;
  upvotesCount?: number;
}

export interface QuoteReply {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Timestamp;
}

export type QuoteSort = 'recent' | 'upvoted';

export function useQuotes(coveId: string | undefined) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<QuoteSort>('recent');
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());

  // 🔥 Stable Listener
  useEffect(() => {
    if (!coveId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, 'coves', coveId, 'quotes'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      let list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Quote))
        // 🔥 FILTER OUT TEMP NULL TIMESTAMPS
        .filter((q) => q.createdAt);

      if (sort === 'upvoted') {
        list = [...list].sort(
          (a, b) => (b.upvotesCount ?? 0) - (a.upvotesCount ?? 0)
        );
      }

      setQuotes(list);
      setLoading(false);
    });

    return () => unsub();
  }, [coveId, sort]);

  // 🔥 Track Upvotes
  useEffect(() => {
    if (!coveId || !auth.currentUser || quotes.length === 0) {
      setUpvotedIds(new Set());
      return;
    }

    const uid = auth.currentUser.uid;
    const unsubs: (() => void)[] = [];

    quotes.forEach((quote) => {
      const ref = doc(
        db,
        'coves',
        coveId,
        'quotes',
        quote.id,
        'upvotes',
        uid
      );

      unsubs.push(
        onSnapshot(ref, (snap) => {
          setUpvotedIds((prev) => {
            const next = new Set(prev);
            if (snap.exists()) next.add(quote.id);
            else next.delete(quote.id);
            return next;
          });
        })
      );
    });

    return () => unsubs.forEach((u) => u());
  }, [coveId, quotes]);

  // 🔥 FIXED CREATE QUOTE
  const createQuote = async (content: string) => {
    if (!coveId || !auth.currentUser)
      throw new Error('You must be logged in');

    const user = auth.currentUser;

    await addDoc(collection(db, 'coves', coveId, 'quotes'), {
      authorId: user.uid,
      authorName: user.displayName || 'Member',
      content: content.trim(),
      coveId,
      createdAt: serverTimestamp(),
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
    const upvoteRef = doc(
      db,
      'coves',
      coveId,
      'quotes',
      quoteId,
      'upvotes',
      uid
    );
    const quoteRef = doc(db, 'coves', coveId, 'quotes', quoteId);

    const batch = writeBatch(db);

    if (upvotedIds.has(quoteId)) {
      batch.delete(upvoteRef);
      batch.update(quoteRef, { upvotesCount: increment(-1) });
    } else {
      batch.set(upvoteRef, {
        userId: uid,
        createdAt: serverTimestamp(),
      });
      batch.update(quoteRef, { upvotesCount: increment(1) });
    }

    await batch.commit();
  };

  const hasUpvoted = (quoteId: string) => upvotedIds.has(quoteId);

  // 🔥 Replies
  const subscribeReplies = (
    quoteId: string,
    onReplies: (replies: QuoteReply[]) => void
  ) => {
    if (!coveId) return () => {};

    const q = query(
      collection(db, 'coves', coveId, 'quotes', quoteId, 'replies'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as QuoteReply))
        .filter((r) => r.createdAt);

      onReplies(list);
    });

    return () => unsub();
  };

  const addReply = async (quoteId: string, content: string) => {
    if (!coveId || !auth.currentUser)
      throw new Error('You must be logged in');

    const user = auth.currentUser;

    await addDoc(
      collection(db, 'coves', coveId, 'quotes', quoteId, 'replies'),
      {
        authorId: user.uid,
        authorName: user.displayName || 'Member',
        content: content.trim(),
        createdAt: serverTimestamp(),
      }
    );
  };

  return {
    quotes,
    loading,
    sort,
    setSort,
    createQuote,
    deleteQuote,
    toggleUpvote,
    hasUpvoted,
    subscribeReplies,
    addReply,
  };
}
