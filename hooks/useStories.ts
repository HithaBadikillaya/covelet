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
    updateDoc,
    where,
    writeBatch,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

export interface Story {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    createdAt: { seconds: number; nanoseconds: number } | null;
    isAnonymous: boolean;
    likesCount: number;
}

export interface UseStoriesResult {
    stories: Story[];
    loading: boolean;
    error: string | null;
    createStory: (content: string, isAnonymous: boolean) => Promise<void>;
    deleteStory: (storyId: string) => Promise<void>;
    editStory: (storyId: string, content: string) => Promise<void>;
    toggleLike: (storyId: string, currentLikesCount: number) => Promise<void>;
    hasLiked: (storyId: string) => boolean;
}

export function useStories(coveId: string | undefined): UseStoriesResult {
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [likedStories, setLikedStories] = useState<Set<string>>(new Set());

    // Fetch stories
    useEffect(() => {
        if (!coveId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, 'coves', coveId, 'humans'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const storiesData: Story[] = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Story[];

                setStories(storiesData);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error fetching stories:', err);
                setError('Failed to load stories');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [coveId]);

    // Fetch user's likes
    useEffect(() => {
        if (!coveId || !auth.currentUser) {
            setLikedStories(new Set());
            return;
        }

        const userId = auth.currentUser.uid;

        // Optimized: Single listener for all likes by this user in this cove.
        const q = query(
            collectionGroup(db, 'likes'),
            where('userId', '==', userId),
            where('coveId', '==', coveId)
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const next = new Set<string>();
            snap.docs.forEach((doc) => {
                const data = doc.data();
                if (data.storyId) {
                    next.add(data.storyId);
                } else {
                    const parts = doc.ref.path.split('/');
                    if (parts[1] === coveId && parts[3]) {
                        next.add(parts[3]);
                    }
                }
            });
            setLikedStories(next);
        }, (err) => {
            console.error('Error in like listener:', err);
        });

        return () => unsubscribe();
    }, [coveId]);

    const createStory = async (content: string, isAnonymous: boolean) => {
        if (!coveId || !auth.currentUser) {
            throw new Error('You must be logged in to create a story');
        }

        const user = auth.currentUser;
        const now = new Date();
        const storyData = {
            authorId: user.uid,
            authorName: user.displayName || 'Anonymous',
            authorAvatar: user.photoURL || null,
            content: content.trim(),
            createdAt: serverTimestamp(),
            day: now.getDate(),
            month: now.getMonth(),
            isAnonymous,
            likesCount: 0,
        };

        try {
            await addDoc(collection(db, 'coves', coveId, 'humans'), storyData);
        } catch (err: any) {
            console.error('Error creating story:', err);
            throw new Error(err.message || 'Failed to create story');
        }
    };

    const deleteStory = async (storyId: string) => {
        if (!coveId) return;

        try {
            await deleteDoc(doc(db, 'coves', coveId, 'humans', storyId));
        } catch (err: any) {
            console.error('Error deleting story:', err);
            throw new Error(err.message || 'Failed to delete story');
        }
    };

    const editStory = async (storyId: string, content: string) => {
        if (!coveId) return;

        const trimmed = content.trim();
        if (!trimmed) throw new Error('Content cannot be empty');

        try {
            await updateDoc(doc(db, 'coves', coveId, 'humans', storyId), {
                content: trimmed,
            });
        } catch (err: any) {
            console.error('Error editing story:', err);
            const e = new Error(err.message || 'Failed to edit story') as Error & { code?: string };
            e.code = err?.code;
            throw e;
        }
    };

    const toggleLike = async (storyId: string, currentLikesCount: number) => {
        if (!coveId || !auth.currentUser) return;

        const userId = auth.currentUser.uid;
        const likeRef = doc(
            db,
            'coves',
            coveId,
            'humans',
            storyId,
            'likes',
            userId
        );
        const storyRef = doc(db, 'coves', coveId, 'humans', storyId);

        const hasLiked = likedStories.has(storyId);

        try {
            const batch = writeBatch(db);

            if (hasLiked) {
                // Unlike: remove like doc and decrement count
                batch.delete(likeRef);
                batch.update(storyRef, {
                    likesCount: increment(-1),
                });
            } else {
                // Like: create like doc and increment count
                batch.set(likeRef, {
                    userId,
                    coveId,
                    storyId,
                    createdAt: serverTimestamp(),
                });
                batch.update(storyRef, {
                    likesCount: increment(1),
                });
            }

            await batch.commit();
        } catch (err: any) {
            console.error('Error toggling like:', err);
            throw new Error(err.message || 'Failed to toggle like');
        }
    };

    const hasLiked = (storyId: string): boolean => {
        return likedStories.has(storyId);
    };

    return {
        stories,
        loading,
        error,
        createStory,
        deleteStory,
        editStory,
        toggleLike,
        hasLiked,
    };
}
