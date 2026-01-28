import { auth } from '@/firebaseConfig';
import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    User
} from 'firebase/auth';

const getFriendlyErrorMessage = (error: any) => {
    switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Invalid email or password. Please check your credentials or sign up.';
        case 'auth/email-already-in-use':
            return 'This email is already registered. Try signing in instead.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        default:
            return error.message || 'An unexpected error occurred.';
    }
};

export const signIn = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error: any) {
        throw new Error(getFriendlyErrorMessage(error));
    }
};

export const signUp = async (email: string, password: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error: any) {
        throw new Error(getFriendlyErrorMessage(error));
    }
};

export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error: any) {
        throw error;
    }
};

export const resetPassword = async (email: string) => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        throw error;
    }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

// Google sign-in logic will be handled within the component using expo-auth-session/google
// as it requires more complex setup for web/native compatibility.
