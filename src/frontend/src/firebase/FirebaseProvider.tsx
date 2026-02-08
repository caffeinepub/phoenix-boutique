/**
 * Lightweight React context provider exposing Firebase availability and references to initialized services.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import {
  getFirebaseAuth,
  getFirebaseFirestore,
  getFirebaseStorage,
  isFirebaseConfigured,
  Auth,
  Firestore,
  FirebaseStorage,
} from './firebaseApp';

interface FirebaseContextValue {
  isConfigured: boolean;
  auth: Auth | null;
  firestore: Firestore | null;
  storage: FirebaseStorage | null;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  isConfigured: false,
  auth: null,
  firestore: null,
  storage: null,
});

export function useFirebase() {
  return useContext(FirebaseContext);
}

interface FirebaseProviderProps {
  children: ReactNode;
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const value: FirebaseContextValue = {
    isConfigured: isFirebaseConfigured(),
    auth: getFirebaseAuth(),
    firestore: getFirebaseFirestore(),
    storage: getFirebaseStorage(),
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}
