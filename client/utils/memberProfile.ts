import { db } from '@/firebaseConfig';
import { normalizeAvatarSeed, normalizeSingleLineText } from '@/utils/security';
import type { User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

export interface StoredUserProfile {
    name: string;
    email: string;
    avatarSeed?: string;
}

function toTitleCase(value: string) {
    return value
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

export function getFallbackAvatarSeed(userId: string, avatarSeed?: string | null) {
    return normalizeAvatarSeed(avatarSeed || userId || 'member');
}

export function normalizeStoredUserName(value: string | null | undefined) {
    return normalizeSingleLineText(value || '', 60);
}

export function normalizeStoredUserEmail(value: string | null | undefined) {
    return normalizeSingleLineText((value || '').trim().toLowerCase(), 320);
}

export function deriveLegacyName(user: Pick<User, 'displayName' | 'email'> | null | undefined) {
    const directName = normalizeStoredUserName(user?.displayName);
    if (directName) {
        return directName;
    }

    const emailPrefix = (user?.email || '').split('@')[0]?.replace(/[._-]+/g, ' ') || '';
    const emailName = normalizeStoredUserName(emailPrefix);
    if (emailName) {
        return toTitleCase(emailName);
    }

    return 'User';
}

export async function getStoredUserProfile(userId: string): Promise<StoredUserProfile | null> {
    if (!db) return null;
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) {
        return null;
    }

    const data = snap.data();
    const name = normalizeStoredUserName(data.name);
    const email = normalizeStoredUserEmail(data.email);

    if (!name || !email) {
        return null;
    }

    return {
        name,
        email,
        avatarSeed: typeof data.avatarSeed === 'string' ? getFallbackAvatarSeed(userId, data.avatarSeed) : undefined,
    };
}

export async function ensureUserProfile(user: Pick<User, 'uid' | 'displayName' | 'email'>) {
    if (!db) return null;
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    const existing = snap.exists() ? snap.data() : {};

    const name = normalizeStoredUserName(existing.name) || deriveLegacyName(user);
    const email = normalizeStoredUserEmail(existing.email || user.email);
    const avatarSeed = getFallbackAvatarSeed(user.uid, typeof existing.avatarSeed === 'string' ? existing.avatarSeed : undefined);

    if (!email) {
        throw new Error('Your account email is missing. Please sign in again.');
    }

    const currentName = normalizeStoredUserName(existing.name);
    const currentEmail = normalizeStoredUserEmail(existing.email);
    const currentAvatarSeed = typeof existing.avatarSeed === 'string' ? getFallbackAvatarSeed(user.uid, existing.avatarSeed) : '';

    if (!snap.exists() || currentName !== name || currentEmail !== email || currentAvatarSeed !== avatarSeed) {
        await setDoc(ref, {
            name,
            email,
            avatarSeed,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    }

    return { name, email, avatarSeed };
}

export async function getRequiredUserProfile(userId: string) {
    const profile = await getStoredUserProfile(userId);
    if (!profile) {
        throw new Error('Your user profile is missing. Please sign in again to repair it.');
    }
    return profile;
}