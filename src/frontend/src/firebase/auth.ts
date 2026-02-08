/**
 * Firebase Auth helper functions with real authentication operations using dynamic imports and clear English errors when unavailable.
 */

import { getFirebaseAuth } from './firebaseApp';

// Type stub for User when Firebase is not installed
export type User = any;

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<void> {
  const auth = getFirebaseAuth();

  if (!auth) {
    throw new Error('Firebase is not installed. Run: pnpm add firebase');
  }

  try {
    // Dynamic import using Function constructor to bypass TypeScript module resolution
    const importAuth = new Function('return import("firebase/auth")');
    const authModule = await importAuth().catch(() => null);
    
    if (!authModule) {
      throw new Error('Firebase Auth module not available. Please install firebase package.');
    }

    const { createUserWithEmailAndPassword } = authModule;
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create account');
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<void> {
  const auth = getFirebaseAuth();

  if (!auth) {
    throw new Error('Firebase is not installed. Run: pnpm add firebase');
  }

  try {
    // Dynamic import using Function constructor to bypass TypeScript module resolution
    const importAuth = new Function('return import("firebase/auth")');
    const authModule = await importAuth().catch(() => null);
    
    if (!authModule) {
      throw new Error('Firebase Auth module not available. Please install firebase package.');
    }

    const { signInWithEmailAndPassword } = authModule;
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in');
  }
}

export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();

  if (!auth) {
    throw new Error('Firebase is not configured');
  }

  try {
    // Dynamic import using Function constructor to bypass TypeScript module resolution
    const importAuth = new Function('return import("firebase/auth")');
    const authModule = await importAuth().catch(() => null);
    
    if (!authModule) {
      throw new Error('Firebase Auth module not available. Please install firebase package.');
    }

    const { signOut: firebaseSignOut } = authModule;
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign out');
  }
}
