/**
 * API service layer for communicating with the Covelet backend.
 *
 * - Base URL is configurable via EXPO_PUBLIC_API_URL (no hardcoded localhost)
 * - Automatically injects Firebase auth token
 * - Handles 401 → sign out, 429 → rate limited, network errors → user-friendly message
 */

import Constants from 'expo-constants';
import { auth } from '@/firebaseConfig';

const extra = Constants.expoConfig?.extra || {};

// API base URL — configurable per environment, no localhost dependency
const API_BASE_URL: string = extra.apiUrl;
if (!API_BASE_URL) {
  throw new Error('API URL not configured. Check your environment variables and expo-constants extra.');
}

/**
 * Get the current user's Firebase ID token for API authentication.
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const user = auth?.currentUser;
    if (!user) return null;
    return await user.getIdToken(false);
  } catch {
    return null;
  }
}

interface ApiError {
  code: string;
  message: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

/**
 * Make an authenticated API request.
 */
async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const token = await getAuthToken();

  if (!token) {
    return {
      error: {
        code: 'AUTH_MISSING',
        message: 'You must be signed in to perform this action.',
      },
    };
  }

  const url = `${API_BASE_URL}/api${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    // Handle rate limiting
    if (response.status === 429) {
      return {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please wait a moment and try again.',
        },
      };
    }

    // Handle auth errors
    if (response.status === 401) {
      return {
        error: {
          code: 'AUTH_EXPIRED',
          message: 'Your session has expired. Please sign in again.',
        },
      };
    }

    const json = await response.json();

    if (!response.ok) {
      return {
        error: json.error || {
          code: 'API_ERROR',
          message: json.message || 'Something went wrong. Please try again.',
        },
      };
    }

    return { data: json as T };
  } catch (err: any) {
    if (__DEV__) {
      console.warn(`[API] Network Error connecting to ${API_BASE_URL}.`);
      if (API_BASE_URL.includes('10.0.2.2')) {
        console.warn('Tip: "10.0.2.2" ONLY works on the Android Emulator. For physical devices, use your computer\'s local IP (e.g., http://192.168.x.x:3001).');
      } else if (API_BASE_URL.includes('localhost')) {
        console.warn('Tip: "localhost" does not work on mobile devices. Use your computer\'s local IP (e.g., http://192.168.x.x:3001).');
      }
    }
    // Network error (no internet, server down, etc.)
    return {
      error: {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to the server. Please check your internet connection.',
      },
    };
  }
}

// Convenience methods

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  return apiRequest<T>('GET', path);
}

export async function apiPost<T>(
  path: string,
  body: Record<string, unknown>
): Promise<ApiResponse<T>> {
  return apiRequest<T>('POST', path, body);
}

export async function apiPut<T>(
  path: string,
  body: Record<string, unknown>
): Promise<ApiResponse<T>> {
  return apiRequest<T>('PUT', path, body);
}

export async function apiDelete<T>(path: string): Promise<ApiResponse<T>> {
  return apiRequest<T>('DELETE', path);
}

export { API_BASE_URL };
