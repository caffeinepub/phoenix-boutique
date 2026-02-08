import { useNavigation } from '../navigation/NavigationProvider';
import { useRole } from '../rbac/useRole';
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
import { StaffManagementScreen } from '../screens/StaffManagementScreen';
import { AuditLogsScreen } from '../screens/AuditLogsScreen';
import { AccessDeniedScreen } from '../shared/ui/AccessDeniedScreen';

export function AppShell() {
  const { currentScreen } = useNavigation();
  const { permissions } = useRole();

  // Guard restricted screens
  const isRestrictedScreen = (screen: string): boolean => {
    return ['reports', 'audit-accounts', 'printable-summary', 'printable-audit-summary', 'staff-management', 'audit-logs'].includes(screen);
  };

  const renderScreen = () => {
    // Check if current screen is restricted and user lacks permission
    if (isRestrictedScreen(currentScreen)) {
      if (currentScreen === 'reports' && !permissions.canViewReports) {
        return <AccessDeniedScreen title="Reports Access Denied" message="Reports and exports are restricted to administrators only." />;
      }
      if (currentScreen === 'audit-accounts' && !permissions.canViewAudit) {
        return <AccessDeniedScreen title="Audit Access Denied" message="Audit & Accounts is restricted to administrators only." />;
      }
      if ((currentScreen === 'printable-summary' || currentScreen === 'printable-audit-summary') && !permissions.canViewReports) {
        return <AccessDeniedScreen title="Print Access Denied" message="Printable reports are restricted to administrators only." />;
      }
      if (currentScreen === 'staff-management' && !permissions.canManageStaff) {
        return <AccessDeniedScreen title="Staff Management Access Denied" message="Staff management is restricted to administrators only." />;
      }
      if (currentScreen === 'audit-logs' && !permissions.canViewAudit) {
        return <AccessDeniedScreen title="Audit Logs Access Denied" message="Audit logs are restricted to administrators only." />;
      }
    }

    // Render the appropriate screen
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'new-order':
        return <NewOrderScreen />;
      case 'orders-list':
        return <OrdersListScreen />;
      case 'order-details':
        return <OrderDetailsScreen />;
      case 'edit-order':
        return <EditOrderScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'printable-summary':
        return <PrintableSummaryScreen />;
      case 'printable-audit-summary':
        return <PrintableAuditSummaryScreen />;
      case 'audit-accounts':
        return <AuditAccountsScreen />;
      case 'staff-management':
        return <StaffManagementScreen />;
      case 'audit-logs':
        return <AuditLogsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

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
          {renderScreen()}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
