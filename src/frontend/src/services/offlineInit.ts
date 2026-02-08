/**
 * Initialize offline-first capabilities with robust error handling and Firebase integration awareness.
 * This runs on app startup and does not require network connectivity.
 */

import { initDb } from './localDb';

export async function initializeOffline(): Promise<void> {
  try {
    // Initialize local IndexedDB (includes migration handling)
    await initDb();
    console.log('Offline persistence initialized successfully');
    
    // Note: Firebase initialization happens separately in firebaseApp.ts
    // and does not block offline functionality
  } catch (error) {
    console.error('Failed to initialize offline persistence:', error);
    throw error;
  }
}
