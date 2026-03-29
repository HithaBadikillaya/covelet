/**
 * Dev-only logger for client-side code.
 *
 * Fixes C4: Prevents 40+ console.log statements from leaking
 * sensitive data (UIDs, cove IDs, internal state) in production APK builds.
 *
 * - In __DEV__ mode: logs normally to console
 * - In production: suppresses log/warn, and only logs error messages (not full objects)
 */

const log = (...args: any[]) => {
  if (__DEV__) {
    console.log(...args);
  }
};

const warn = (...args: any[]) => {
  if (__DEV__) {
    console.warn(...args);
  }
};

const error = (...args: any[]) => {
  if (__DEV__) {
    console.error(...args);
  } else {
    // In production, only log the first argument (human-readable message)
    // to avoid leaking stack traces and internal Firestore paths
    const message = typeof args[0] === 'string' ? args[0] : 'App error';
    console.error(message);
  }
};

export const logger = { log, warn, error };
