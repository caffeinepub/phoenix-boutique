/**
 * Non-visual component that manages automatic sync triggers without blocking navigation or rendering.
 */

import { useOrdersAutoSync } from '../hooks/useOrdersAutoSync';

export function AutoSyncManager() {
  // This hook handles all auto-sync logic internally
  useOrdersAutoSync();
  
  // This component renders nothing
  return null;
}
