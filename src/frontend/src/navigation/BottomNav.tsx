import { useNavigation } from './NavigationProvider';
import { Home, Plus, List } from 'lucide-react';

export function BottomNav() {
  const { currentScreen, navigateTo } = useNavigation();

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Home },
    { id: 'new-order' as const, label: 'New Order', icon: Plus },
    { id: 'orders-list' as const, label: 'Orders', icon: List },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card shadow-soft-lg z-50">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`flex flex-1 flex-col items-center gap-1 px-4 py-3 transition-all duration-200 ${
                  isActive
                    ? 'text-primary scale-105'
                    : 'text-muted-foreground hover:text-foreground hover:scale-105'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
