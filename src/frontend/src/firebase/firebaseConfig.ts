/**
 * Firebase configuration loader that reads from environment variables.
 * Returns typed config and an 'isConfigured' flag for safe initialization.
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface FirebaseConfigResult {
  config: FirebaseConfig | null;
  isConfigured: boolean;
}

export function getFirebaseConfig(): FirebaseConfigResult {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;

  // Check if all required config values are present
  const isConfigured = !!(
    apiKey &&
    authDomain &&
    projectId &&
    storageBucket &&
    messagingSenderId &&
    appId
  );

  if (!isConfigured) {
    return { config: null, isConfigured: false };
  }

  return {
    config: {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    },
    isConfigured: true,
  };
}
