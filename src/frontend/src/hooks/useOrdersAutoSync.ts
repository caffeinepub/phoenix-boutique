/**
 * Hook that wires sync triggers with role-aware context: attempts sync once after startup (only after offline DB is ready), listens for online/offline transitions to trigger sync on reconnect, passes current user role to sync service, and exposes internal state to avoid concurrent sync attempts.
 */

import { useEffect, useState, useRef } from 'react';
import { useFirebaseAuth } from '../firebase/useFirebaseAuth';
import { useFirebase } from '../firebase/FirebaseProvider';
import { useOnlineStatus } from '../shared/hooks/useOnlineStatus';
import { useRole } from '../rbac/useRole';
import { syncOrders } from '../services/ordersSyncService';

export function useOrdersAutoSync() {
  const { isConfigured } = useFirebase();
  const { user, isAuthenticated } = useFirebaseAuth();
  const { role } = useRole();
  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAttempt, setLastSyncAttempt] = useState<number>(0);
  const hasAttemptedInitialSync = useRef(false);
  const wasOffline = useRef(!isOnline);

  // Perform sync if conditions are met
  const attemptSync = async () => {
    // Guard: don't sync if already syncing
    if (isSyncing) {
      return;
    }

    // Guard: only sync if Firebase is configured, user is authenticated, and online
    if (!isConfigured || !isAuthenticated || !user || !isOnline) {
      return;
    }

    // Throttle: don't sync more than once per 5 seconds
    const now = Date.now();
    if (now - lastSyncAttempt < 5000) {
      return;
    }

    setIsSyncing(true);
    setLastSyncAttempt(now);

    try {
      const userId = user.uid;
      // Pass role context to sync service (defaults to STAFF if not provided)
      await syncOrders(userId, role);
    } catch (error) {
      console.error('Auto-sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Trigger 1: Initial sync on app start (once)
  useEffect(() => {
    if (!hasAttemptedInitialSync.current && isConfigured && isAuthenticated && isOnline) {
      hasAttemptedInitialSync.current = true;
      // Small delay to ensure offline DB is fully ready
      const timer = setTimeout(() => {
        attemptSync();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isConfigured, isAuthenticated, isOnline]);

  // Trigger 2: Sync on internet reconnect
  useEffect(() => {
    if (wasOffline.current && isOnline) {
      // Device just came online
      attemptSync();
    }
    wasOffline.current = !isOnline;
  }, [isOnline]);

  return {
    isSyncing,
    attemptSync,
  };
}
