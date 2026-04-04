# Covelet

A premium, secure memory-sharing and digital scrapbooking application. Designed as a digital vault for families and friends to curate their most precious moments with futuristic aesthetics and robust security.

## Features

- **Protected Coves**: Private group spaces for sharing memories within a trusted, curated circle.
- **Time Capsules**: Create and unlock scheduled memory sets for collaborative, synchronized reliving.
- **Secure Vault Architecture**: Advanced server-authoritative data management with reliable cascade deletions.
- **Memory Discovery**: Relive forgotten moments through dynamic discovery tools like Roulette and Flashbacks.
- **Unified Experience**: High-performance mobile interface built on Expo with NativeWind styling.

## Tech Stack

Built with React Native (Expo), NativeWind, Firebase, and Node.js.


## Setup Instructions

### 1. Install Dependencies

To install all required packages for the root, client, and server:

```bash
npm run install-all
```

### 2. Environment Configuration

Copy the example environment files and populate them with your Firebase credentials:

- **Client**: Create `client/.env` and set all `EXPO_PUBLIC_FIREBASE_*` variables and `EXPO_PUBLIC_API_URL`.
- **Server**: Create `server/.env` and ensure your `service-account.json` is present in the `server/` directory.

### 3. Connectivity (Physical Android)

If you are using a physical Android device for testing, forward the required development ports:

```bash
npm run reverse
```

### 4. Launch Development Servers

Start both the Express backend and the Expo development server concurrently:

```bash
npm run dev
```
