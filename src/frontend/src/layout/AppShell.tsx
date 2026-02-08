import { useNavigation } from '../navigation/NavigationProvider';
import { BottomNav } from '../navigation/BottomNav';
import { DashboardScreen } from '../screens/DashboardScreen';
import { NewOrderScreen } from '../screens/NewOrderScreen';
import { OrdersListScreen } from '../screens/OrdersListScreen';
import { OrderDetailsScreen } from '../screens/OrderDetailsScreen';
import { EditOrderScreen } from '../screens/EditOrderScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { PrintableSummaryScreen } from '../screens/PrintableSummaryScreen';
import { PrintableAuditSummaryScreen } from '../screens/PrintableAuditSummaryScreen';
import { AuditAccountsScreen } from '../screens/AuditAccountsScreen';

export function AppShell() {
  const { currentScreen } = useNavigation();

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="app-header border-b border-border bg-card px-4 py-4 shadow-soft">
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Phoenix Boutique
          </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main flex-1 overflow-y-auto pb-20">
        <div className="mx-auto max-w-md px-4 py-6">
          {currentScreen === 'dashboard' && <DashboardScreen />}
          {currentScreen === 'new-order' && <NewOrderScreen />}
          {currentScreen === 'orders-list' && <OrdersListScreen />}
          {currentScreen === 'order-details' && <OrderDetailsScreen />}
          {currentScreen === 'edit-order' && <EditOrderScreen />}
          {currentScreen === 'reports' && <ReportsScreen />}
          {currentScreen === 'printable-summary' && <PrintableSummaryScreen />}
          {currentScreen === 'printable-audit-summary' && <PrintableAuditSummaryScreen />}
          {currentScreen === 'audit-accounts' && <AuditAccountsScreen />}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
