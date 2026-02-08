import { createContext, useContext, useState, type ReactNode } from 'react';

type Screen = 'dashboard' | 'new-order' | 'orders-list' | 'order-details' | 'edit-order' | 'reports' | 'printable-summary' | 'printable-audit-summary' | 'audit-accounts' | 'staff-management' | 'audit-logs';

interface NavigationState {
  orderId?: number;
  [key: string]: any;
}

interface NavigationContextType {
  currentScreen: Screen;
  navigationState: NavigationState | null;
  navigateTo: (screen: Screen, state?: NavigationState) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [navigationState, setNavigationState] = useState<NavigationState | null>(null);

  const navigateTo = (screen: Screen, state?: NavigationState) => {
    setCurrentScreen(screen);
    setNavigationState(state || null);
  };

  return (
    <NavigationContext.Provider value={{ currentScreen, navigationState, navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
