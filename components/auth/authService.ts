import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { auth } from '@/firebaseConfig';
import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithCredential,
    signInWithEmailAndPassword,
    User,
} from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

/* =========================
   Error handling
========================= */
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
        case 'auth/popup-closed-by-user':
            return 'Sign-in was cancelled.';
        default:
            return error.message || 'Something broke. Try again.';
    }
};

/* =========================
   Email / Password
========================= */
export const signIn = async (email: string, password: string) => {
    try {
        const res = await signInWithEmailAndPassword(auth, email, password);
        return res.user;
    } catch (err: any) {
        throw new Error(getFriendlyErrorMessage(err));
    }
};

export const signUp = async (email: string, password: string) => {
    try {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        return res.user;
    } catch (err: any) {
        throw new Error(getFriendlyErrorMessage(err));
    }
};

export const signOut = async () => {
    await firebaseSignOut(auth);
};

export const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
};

export const subscribeToAuthChanges = (
    callback: (user: User | null) => void
) => {
    return onAuthStateChanged(auth, callback);
};

/* =========================
   Google Sign-In (Expo)
========================= */

// Replace these with values from Firebase Console → Google auth
const GOOGLE_IDS = {
    android:
        process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID!,
    ios:
        process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID!,
    web:
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
};

export const useGoogleAuth = () => {
    return Google.useAuthRequest({
        clientId:
            Platform.OS === 'android'
                ? GOOGLE_IDS.android
                : Platform.OS === 'ios'
                    ? GOOGLE_IDS.ios
                    : GOOGLE_IDS.web,
    });
};

export const signInWithGoogle = async (idToken: string) => {
    try {
        const credential = GoogleAuthProvider.credential(idToken);
        const res = await signInWithCredential(auth, credential);
        return res.user;
    } catch (err: any) {
        throw new Error(getFriendlyErrorMessage(err));
    }
};
