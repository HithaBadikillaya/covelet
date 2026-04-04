/**
 * Firebase Admin SDK initialization.
 *
 * Supports three credential methods (in priority order):
 * 1. FIREBASE_SERVICE_ACCOUNT_JSON — JSON string (for Render/Heroku)
 * 2. FIREBASE_SERVICE_ACCOUNT_PATH — path to .json file
 * 3. GOOGLE_APPLICATION_CREDENTIALS — standard GCP env var
 * 4. Application Default Credentials (ADC) — for GCP-hosted environments
 */

const admin = require('firebase-admin');
const fs = require('fs');

function initializeFirebase(config) {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  let credential;

  // Method 1: Base64 string from environment (Preferred for Render/Heroku)
  if (config.firebase.serviceAccountBase64) {
    try {
      const serviceAccount = JSON.parse(
        Buffer.from(config.firebase.serviceAccountBase64, 'base64').toString('utf8')
      );
      credential = admin.credential.cert(serviceAccount);
      console.log('✅ Firebase Admin: Initialized with service account Base64 from env');
    } catch (err) {
      console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:', err.message);
      process.exit(1);
    }
  }
  // Method 2: JSON string from environment
  else if (config.firebase.serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(config.firebase.serviceAccountJson);
      credential = admin.credential.cert(serviceAccount);
      console.log('✅ Firebase Admin: Initialized with service account JSON from env');
    } catch (err) {
      console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
      process.exit(1);
    }
  }
  // Method 2: File path
  else if (config.firebase.serviceAccountPath) {
    const filePath = config.firebase.serviceAccountPath;
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Service account file not found: ${filePath}`);
      console.error('   Download from: Firebase Console → Project Settings → Service Accounts');
      process.exit(1);
    }
    const serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    credential = admin.credential.cert(serviceAccount);
    console.log('✅ Firebase Admin: Initialized with service account file');
  }
  // Method 3: Application Default Credentials
  else {
    credential = admin.credential.applicationDefault();
    console.log('✅ Firebase Admin: Initialized with Application Default Credentials');
  }

  admin.initializeApp({
    credential,
    projectId: config.firebase.projectId,
  });

  return admin.app();
}

function getFirestore() {
  return admin.firestore();
}

function getAuth() {
  return admin.auth();
}

module.exports = { initializeFirebase, getFirestore, getAuth, admin };
