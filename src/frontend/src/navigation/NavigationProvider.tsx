import { createContext, useContext, useState, type ReactNode } from 'react';

type Screen = 'dashboard' | 'new-order' | 'orders-list' | 'order-details' | 'edit-order' | 'reports' | 'printable-summary' | 'printable-audit-summary' | 'audit-accounts';

interface NavigationContextValue {
  currentScreen: Screen;
  navigateTo: (screen: Screen) => void;
  selectedOrderId: number | null;
  setSelectedOrderId: (id: number | null) => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  return (
    <NavigationContext.Provider value={{ currentScreen, navigateTo, selectedOrderId, setSelectedOrderId }}>
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
