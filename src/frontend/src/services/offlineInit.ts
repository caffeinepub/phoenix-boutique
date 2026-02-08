import { initDb } from './localDb';

/**
 * Initialize offline-first capabilities with robust error handling.
 * This runs on app startup and does not require network connectivity.
 */
export async function initializeOffline(): Promise<void> {
  try {
    // Initialize local IndexedDB (includes migration handling)
    await initDb();
    console.log('Offline persistence initialized successfully');
  } catch (error) {
    console.error('Failed to initialize offline persistence:', error);
    throw error;
  }
}
