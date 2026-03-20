// firebaseConfig.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

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

console.log("✅ Firebase initialized:", app.name);
