import Constants from 'expo-constants';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const extra = Constants.expoConfig?.extra || {};

const firebaseConfig = {
    apiKey: extra.firebaseApiKey,
    authDomain: extra.firebaseAuthDomain,
    projectId: extra.firebaseProjectId,
    storageBucket: extra.firebaseStorageBucket,
    messagingSenderId: extra.firebaseMessagingSenderId,
    appId: extra.firebaseAppId,
    measurementId: extra.firebaseMeasurementId,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Firebase configuration missing. Ensure environment variables are set and expo-constants extra is populated.');
}

// Initialize Firebase App
let app;
try {
    if (!firebaseConfig.apiKey) {
        throw new Error("Firebase API Key is missing. Check your environment variables.");
    }
    app = initializeApp(firebaseConfig);
} catch (error) {
    console.error("❌ Firebase app initialization failed:", error);
}

// Initialize Auth for React Native with persistent storage
export const auth = (() => {
    try {
        return initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage),
        });
    } catch (error) {
        console.error("❌ Firebase auth initialization failed:", error);
        return null;
    }
})();

// Initialize Firestore
export const db = (() => {
    try {
        return getFirestore(app);
    } catch (error) {
        console.error("❌ Firebase firestore initialization failed:", error);
        return null;
    }
})();


