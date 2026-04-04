# Covelet

A fun, secure memory-sharing and digital scrapbooking application. Designed as a digital vault for any group to preserve their most precious moments.

## Features

- **Coves**: Private group spaces for sharing memories within a trusted, curated circle.
- **Time Capsules**: Create and unlock scheduled memory sets for collaborative, synchronized reliving.
- **Secure Vault Architecture**: Advanced server-authoritative data management with reliable cascade deletions.
- **Memory Discovery**: Relive forgotten moments through dynamic discovery tools like Roulette and Flashbacks.
- **Unified Experience**: High-performance mobile interface built on Expo with NativeWind styling.

## Tech Stack

Built with React Native (Expo SDK 52), NativeWind, Firebase, and Node.js.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18 or later
- **Java Development Kit (JDK)**: v17 or later (required for Android)
- **Android Studio**: With Android SDK, Build Tools, and Emulator configured
- **ADB (Android Debug Bridge)**: Required for physical device testing and port forwarding

## Setup Instructions

### 1. Install Dependencies

To install all required packages for the root, client, and server, run the following starting from the project root:

```bash
npm run install-all
```

### 2. Environment Configuration

You must configure both the client and server with your own Firebase credentials.

- **Client Setup**:
  1. Navigate to the `client/` directory.
  2. Copy `.env.example` to `.env`.
  3. Fill in the `EXPO_PUBLIC_FIREBASE_*` variables with your Firebase web configuration.
  4. Set `EXPO_PUBLIC_API_URL` to `http://localhost:3001` (or your local IP for physical devices).
  5. Ensure `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) are present in the `client/` directory if you've already generated them in Firebase.

- **Server Setup**:
  1. Navigate to the `server/` directory.
  2. Copy `.env.example` to `.env`.
  3. Place your Firebase `service-account.json` file in the `server/` directory.
  4. Fill in any other required variables in the `.env` file.


### 3. Android Development Setup

To build and run the application on an Android device or emulator, follow these steps from the root directory:

#### **A. Prebuild the Native Project**
This generates the `android/` directory required for native builds.
```bash
cd client
npx expo prebuild
```

#### **B. Run the App on Android**
This compiles the native code and launches the app. Ensure an emulator is running or a physical device is connected.
```bash
npx expo run:android
```

### 4. Running the Backend

In a separate terminal, start the Express server:
```bash
cd server
npm run dev
```

### 5. Connectivity (Physical Android)

If you are using a physical Android device for testing, you must forward the development ports to allow the app to communicate with the local server:

```bash
# From the root directory
npm run reverse
```

---

## Development Workflow

For a standard development session:
1. Start the server: `cd server && npm run dev`
2. Forward ports (if on physical device): `npm run reverse`
3. Start Expo: `cd client && npx expo start` (or `npx expo run:android` if you need to rebuild native code).

