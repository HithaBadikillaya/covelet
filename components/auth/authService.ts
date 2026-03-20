import { auth, db } from '@/firebaseConfig';
import {
    ensureUserProfile,
    normalizeStoredUserEmail,
    normalizeStoredUserName,
} from '@/utils/memberProfile';
import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    User,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

const getFriendlyErrorMessage = (error: any) => {
    switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Invalid email or password.';
        case 'auth/email-already-in-use':
            return 'This email is already registered.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        default:
            return error.message || 'Something broke. Try again.';
    }
};

export const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Authentication service is unavailable.');
    try {
        const res = await signInWithEmailAndPassword(auth, email, password);
        await ensureUserProfile(res.user);
        return res.user;
    } catch (err: any) {
        throw new Error(getFriendlyErrorMessage(err));
    }
};

export const signUp = async (name: string, email: string, password: string) => {
    if (!auth || !db) throw new Error('Registration service is unavailable.');
    const safeName = normalizeStoredUserName(name);
    const safeEmail = normalizeStoredUserEmail(email);

    if (!safeName) {
        throw new Error('Please enter your name.');
    }

    try {
        const res = await createUserWithEmailAndPassword(auth, safeEmail, password);
        await setDoc(doc(db, 'users', res.user.uid), {
            name: safeName,
            email: normalizeStoredUserEmail(res.user.email || safeEmail),
            avatarSeed: res.user.uid,
            updatedAt: serverTimestamp(),
        }, { merge: true });
        return res.user;
    } catch (err: any) {
        throw new Error(getFriendlyErrorMessage(err));
    }
};

export const signOut = async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
};

export const resetPassword = async (email: string) => {
    if (!auth) throw new Error('Authentication service is unavailable.');
    await sendPasswordResetEmail(auth, email);
};

export const subscribeToAuthChanges = (
    callback: (user: User | null) => void
) => {
    if (!auth) {
        console.warn('⚠️ Skipping auth subscription: Firebase Auth not initialized.');
        callback(null);
        return () => { };
    }

    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                await ensureUserProfile(user);
            } catch (error) {
                console.error('Failed to repair user profile:', error);
            }
        }
        callback(user);
    });
};