/**
 * Local store for last sync time and result to enable status display without network calls.
 */

const SYNC_STATUS_KEY = 'phoenix_boutique_sync_status';

export interface SyncStatus {
  lastSyncTime: string | null;
  lastSyncResult: 'success' | 'error' | null;
  lastSyncMessage: string | null;
}

export function getSyncStatus(): SyncStatus {
  try {
    const stored = localStorage.getItem(SYNC_STATUS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to read sync status:', error);
  }

  return {
    lastSyncTime: null,
    lastSyncResult: null,
    lastSyncMessage: null,
  };
}

export function setSyncStatus(status: SyncStatus): void {
  try {
    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
  } catch (error) {
    console.error('Failed to save sync status:', error);
  }
}

export function updateSyncSuccess(message?: string): void {
  setSyncStatus({
    lastSyncTime: new Date().toISOString(),
    lastSyncResult: 'success',
    lastSyncMessage: message || 'Sync completed successfully',
  });
}

export function updateSyncError(message: string): void {
  setSyncStatus({
    lastSyncTime: new Date().toISOString(),
    lastSyncResult: 'error',
    lastSyncMessage: message,
  });
}
