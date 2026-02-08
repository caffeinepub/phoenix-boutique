/**
 * Main application component that initializes offline persistence, wires auto-sync triggers after DB is ready, and wraps the app with RoleProvider, FirebaseProvider, NavigationProvider, and AppShell.
 */

import { NavigationProvider } from './navigation/NavigationProvider';
import { AppShell } from './layout/AppShell';
import { FirebaseProvider } from './firebase/FirebaseProvider';
import { RoleProvider } from './rbac/RoleProvider';
import { initializeOffline } from './services/offlineInit';
import { useEffect, useState } from 'react';
import { AutoSyncManager } from './components/AutoSyncManager';

function App() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    initializeOffline()
      .then(() => setIsDbReady(true))
      .catch((err) => console.error('Failed to initialize database:', err));
  }, []);

  if (!isDbReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Initializing...</p>
      </div>
    );
  }

  return (
    <RoleProvider>
      <FirebaseProvider>
        <NavigationProvider>
          <AutoSyncManager />
          <AppShell />
        </NavigationProvider>
      </FirebaseProvider>
    </RoleProvider>
  );
}

export default App;
