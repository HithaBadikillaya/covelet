import "dotenv/config";

export default {
  "expo": {
    "name": "covelet",
    "slug": "covelet",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/logo.png",
    "scheme": "covelet",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": false,
    "platforms": ["ios", "android", "web"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.hitha.covelet",
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "package": "com.hitha.covelet",
      "googleServicesFile": "./google-services.json",
      "softwareKeyboardLayoutMode": "pan",
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE"
      },
      "permissions": ["NOTIFICATIONS"]
    },
    "web": {
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
        "expo-router",
        [
          "expo-splash-screen",
          {
            "image": "./assets/images/splash-icon.png",
            "imageWidth": 200,
            "resizeMode": "contain",
            "backgroundColor": "#E6F0E3",
            "dark": {
              "backgroundColor": "#E6F0E3"
            }
          }
        ],
        "expo-font",
        "expo-notifications"
    ],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": false
    },
    "extra": {
      "projectId": "202b9990-0b52-4a40-bd71-f314e65ddb2f",
      "firebaseApiKey": process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      "firebaseAuthDomain": process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      "firebaseProjectId": process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      "firebaseStorageBucket": process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      "firebaseMessagingSenderId": process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      "firebaseAppId": process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      "firebaseMeasurementId": process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
      "googleWebClientId": process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      "googleAndroidClientId": process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      "eas": {
        "projectId": "202b9990-0b52-4a40-bd71-f314e65ddb2f"
      }
    }
  }
}
