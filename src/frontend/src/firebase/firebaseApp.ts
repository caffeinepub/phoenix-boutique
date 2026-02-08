/**
 * Firebase initialization with safe dynamic imports that only activates when environment configuration is present and the Firebase SDK is available, keeping the app fully functional offline when Firebase is missing.
 */

import { getFirebaseConfig } from './firebaseConfig';

// Type stubs for when Firebase is not installed
export type FirebaseApp = any;
export type Auth = any;
export type Firestore = any;
export type FirebaseStorage = any;

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseFirestore: Firestore | null = null;
let firebaseStorage: FirebaseStorage | null = null;
let initializationAttempted = false;

const { config, isConfigured } = getFirebaseConfig();

/**
 * Attempt to initialize Firebase using dynamic imports
 */
async function attemptFirebaseInitialization(): Promise<void> {
  if (initializationAttempted) {
    return;
  }
  
  initializationAttempted = true;

  if (!isConfigured || !config) {
    console.log('Firebase configuration not found. App will run in offline-only mode.');
    return;
  }

  try {
    // Dynamic import to avoid build errors when firebase is not installed
    // Using Function constructor to bypass TypeScript module resolution
    const importFirebase = new Function('return import("firebase/app")');
    const importAuth = new Function('return import("firebase/auth")');
    const importFirestore = new Function('return import("firebase/firestore")');
    const importStorage = new Function('return import("firebase/storage")');

    const firebase = await importFirebase().catch(() => null);
    if (!firebase) {
      console.log('Firebase package not installed. App will run in offline-only mode.');
      return;
    }

    const auth = await importAuth().catch(() => null);
    const firestore = await importFirestore().catch(() => null);
    const storage = await importStorage().catch(() => null);

    if (!auth || !firestore || !storage) {
      console.log('Firebase modules not available. App will run in offline-only mode.');
      return;
    }

    firebaseApp = firebase.initializeApp(config);
    firebaseAuth = auth.getAuth(firebaseApp);
    firebaseFirestore = firestore.getFirestore(firebaseApp);
    firebaseStorage = storage.getStorage(firebaseApp);
    
    console.log('Firebase initialized successfully');
  } catch (error: any) {
    console.warn('Firebase SDK not available. App will run in offline-only mode.', error.message);
    firebaseApp = null;
    firebaseAuth = null;
    firebaseFirestore = null;
    firebaseStorage = null;
  }
}

// Attempt initialization immediately
attemptFirebaseInitialization();

export function getFirebaseApp(): FirebaseApp | null {
  return firebaseApp;
}

export function getFirebaseAuth(): Auth | null {
  return firebaseAuth;
}

export function getFirebaseFirestore(): Firestore | null {
  return firebaseFirestore;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  return firebaseStorage;
}

export function isFirebaseConfigured(): boolean {
  return isConfigured && firebaseApp !== null;
}
