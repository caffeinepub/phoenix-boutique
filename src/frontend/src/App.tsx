import { NavigationProvider } from './navigation/NavigationProvider';
import { AppShell } from './layout/AppShell';
import { initializeOffline } from './services/offlineInit';
import { useEffect, useState } from 'react';

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
    <NavigationProvider>
      <AppShell />
    </NavigationProvider>
  );
}

export default App;
