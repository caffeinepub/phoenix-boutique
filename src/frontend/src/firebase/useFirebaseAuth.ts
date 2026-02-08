/**
 * React hook for Firebase authentication state with real auth state listener when Firebase is available.
 */

import { useState, useEffect } from 'react';
import { getFirebaseAuth, Auth } from './firebaseApp';

// Type stub
export type User = any;

export interface FirebaseAuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useFirebaseAuth(): FirebaseAuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();

    if (!auth) {
      setLoading(false);
      return;
    }

    // Dynamically import onAuthStateChanged using Function constructor to bypass TypeScript
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const importAuth = new Function('return import("firebase/auth")');
        const authModule = await importAuth().catch(() => null);
        
        if (!authModule) {
          setLoading(false);
          return;
        }

        const { onAuthStateChanged } = authModule;
        
        unsubscribe = onAuthStateChanged(auth, (firebaseUser: any) => {
          setUser(firebaseUser);
          setLoading(false);
        });
      } catch (error) {
        console.error('Failed to set up auth listener:', error);
        setLoading(false);
      }
    })();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
}
