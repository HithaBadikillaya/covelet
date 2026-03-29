# Covelet Full-Stack Architecture

Covelet is a secure, decoupled full-stack application for sharing digital memories.

## 📁 Directory Structure

```
covelet/
├── client/              # Expo React Native (Frontend)
├── server/              # Express Node.js (Backend)
├── firestore.rules      # Firestore Security Rules
└── package.json         # Root scripts for coordination
```

## 🚀 Quick Start (Development)

1.  **Install dependencies**:
    ```bash
    npm run install-all
    ```

2.  **Environment Setup**:
    -   **Server**: Create `server/.env` (see `server/.env.example`) and place your `service-account.json`.
    -   **Client**: Create `client/.env` (see `client/.env.example`) and set `EXPO_PUBLIC_API_URL`.

3.  **Run Development Servers**:
    ```bash
    npm run dev
    ```

## 🔒 Security Hardening

-   **Server-Authoritative Deletions**: Complex cascade deletes and member management are handled by the Express backend using the Firebase Admin SDK.
-   **JWT Verification**: All API calls require a valid Firebase ID token.
-   **Rate Limiting**: Tiered rate limiting protects sensitive endpoints.
-   **Input Sanitization**: Multi-layer sanitization (Client UI + Server Middleware).
-   **Secure Logging**: Custom logger suppresses internal state and PII in production builds.

## 🛠️ Tech Stack

-   **Frontend**: Expo (React Native), Firebase Client SDK, Tailwind/Nativewind.
-   **Backend**: Node.js, Express, Firebase Admin SDK.
-   **Security**: Helmet, CORS, Express-Rate-Limit.

## ⚙️ Deployment

-   **Server**: Render / Fly.io / Cloud Run.
-   **Client**: EAS Build for Android (APK) and iOS.

---

Covelet — *A sanctuary for yours and mine.*
