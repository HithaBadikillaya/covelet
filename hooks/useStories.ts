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
    updateDoc,
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
        if (!coveId || !auth.currentUser || stories.length === 0) {
            setLikedStories(new Set());
            return;
        }

        const userId = auth.currentUser.uid;
        const likedSet = new Set<string>();
        const unsubscribers: (() => void)[] = [];

        // Subscribe to likes subcollection for each story
        stories.forEach((story) => {
            const likeRef = doc(
                db,
                'coves',
                coveId,
                'humans',
                story.id,
                'likes',
                userId
            );

            const unsubscribe = onSnapshot(
                likeRef,
                (snap) => {
                    if (snap.exists()) {
                        likedSet.add(story.id);
                    } else {
                        likedSet.delete(story.id);
                    }
                    setLikedStories(new Set(likedSet));
                },
                () => {
                    // Ignore errors (like doc might not exist)
                }
            );

            unsubscribers.push(unsubscribe);
        });

        return () => {
            unsubscribers.forEach((unsub) => unsub());
        };
    }, [coveId, stories]);

    const createStory = async (content: string, isAnonymous: boolean) => {
        if (!coveId || !auth.currentUser) {
            throw new Error('You must be logged in to create a story');
        }

        const user = auth.currentUser;
        const storyData = {
            authorId: user.uid,
            authorName: user.displayName || 'Anonymous',
            authorAvatar: user.photoURL || null,
            content: content.trim(),
            createdAt: serverTimestamp(),
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
