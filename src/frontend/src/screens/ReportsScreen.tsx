/**
 * Reports screen with Audit & Accounts navigation, CSV export actions, printable summary views, Firebase authentication UI (sign up/in/out), role-aware unified sync functionality with manual trigger button passing current user role, Audit Logs access for ADMIN users, and Staff Management access for ADMIN users.
 */

import { ScreenTitle } from '../shared/ui/ScreenTitle';
import { useNavigation } from '../navigation/NavigationProvider';
import { useRole } from '../rbac/useRole';
import { useAllOrders } from '../hooks/useOrdersLiveQuery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileDown, 
  Printer, 
  Calendar, 
  CalendarRange, 
  LogIn, 
  LogOut, 
  UserPlus,
  RefreshCw,
  Users,
  BarChart3,
  FileText
} from 'lucide-react';
import { exportOrdersAsCsv, exportAuditCsv } from '../services/orderCsvExport';
import { useState } from 'react';
import { useFirebase } from '../firebase/FirebaseProvider';
import { useFirebaseAuth } from '../firebase/useFirebaseAuth';
import { signUpWithEmail, signInWithEmail, signOut } from '../firebase/auth';
import { notifyHelper } from '../shared/ui/notify';
import { getSyncStatus } from '../services/syncStatusStore';
import { syncOrders } from '../services/ordersSyncService';
import { useOnlineStatus } from '../shared/hooks/useOnlineStatus';

export function ReportsScreen() {
  const { navigateTo } = useNavigation();
  const { role } = useRole();
  const { data: orders = [] } = useAllOrders();
  const { isConfigured } = useFirebase();
  const { user, isAuthenticated, loading: authLoading } = useFirebaseAuth();
  const isOnline = useOnlineStatus();

  // Firebase auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const syncStatus = getSyncStatus();

  const handleExportCsv = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportOrdersAsCsv(orders, `phoenix-orders-${timestamp}.csv`);
    notifyHelper.success('CSV exported successfully');
  };

  const handleExportAuditCsv = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportAuditCsv(orders, `phoenix-audit-${timestamp}.csv`);
    notifyHelper.success('Audit CSV exported successfully');
  };

  const handlePrintToday = () => {
    navigateTo('printable-summary');
  };

  const handlePrintAudit = () => {
    navigateTo('printable-audit-summary');
  };

  const handleAuditAccounts = () => {
    navigateTo('audit-accounts');
  };

  const handleAuditLogs = () => {
    navigateTo('audit-logs');
  };

  const handleStaffManagement = () => {
    navigateTo('staff-management');
  };

  const handleAuth = async () => {
    if (!email || !password) {
      setAuthError('Please enter email and password');
      return;
    }

    setAuthError(null);
    setIsAuthenticating(true);

    try {
      if (authMode === 'signup') {
        await signUpWithEmail(email, password);
        notifyHelper.success('Account created successfully');
      } else {
        await signInWithEmail(email, password);
        notifyHelper.success('Signed in successfully');
      }
      setEmail('');
      setPassword('');
    } catch (error: any) {
      setAuthError(error.message);
      notifyHelper.error(error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      notifyHelper.success('Signed out successfully');
    } catch (error: any) {
      notifyHelper.error(error.message);
    }
  };

  const handleManualSync = async () => {
    if (!isAuthenticated || !user) {
      notifyHelper.error('Please sign in to sync data');
      return;
    }

    if (!isOnline) {
      notifyHelper.error('Cannot sync while offline');
      return;
    }

    setIsSyncing(true);

    try {
      const userId = user.uid;
      // Pass role context to sync service (defaults to STAFF if not provided)
      const result = await syncOrders(userId, role);
      
      if (result.success) {
        notifyHelper.success(`Synced ${result.uploaded} order${result.uploaded !== 1 ? 's' : ''}`);
      } else {
        notifyHelper.error(`Sync completed with errors: ${result.errors.join(', ')}`);
      }
    } catch (error: any) {
      notifyHelper.error(`Sync failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <ScreenTitle>Reports & Exports</ScreenTitle>

      {/* Audit & Accounts - ADMIN only */}
      {role === 'ADMIN' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Financial Management
            </CardTitle>
            <CardDescription>
              Access audit reports and financial summaries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleAuditAccounts}
              variant="outline"
              className="w-full justify-start"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Audit & Accounts Dashboard
            </Button>
            <Button
              onClick={handleAuditLogs}
              variant="outline"
              className="w-full justify-start"
            >
              <FileText className="mr-2 h-4 w-4" />
              Audit Logs
            </Button>
          </CardContent>
        </Card>
      )}

      {/* CSV Exports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            CSV Exports
          </CardTitle>
          <CardDescription>
            Download order data in CSV format for offline analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleExportCsv}
            variant="outline"
            className="w-full justify-start"
            disabled={orders.length === 0}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export All Orders ({orders.length})
          </Button>
          <Button
            onClick={handleExportAuditCsv}
            variant="outline"
            className="w-full justify-start"
            disabled={orders.length === 0}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export Audit CSV
          </Button>
        </CardContent>
      </Card>

      {/* Printable Views */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Printable Reports
          </CardTitle>
          <CardDescription>
            Generate print-friendly summaries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handlePrintToday}
            variant="outline"
            className="w-full justify-start"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Today & This Week Summary
          </Button>
          {role === 'ADMIN' && (
            <Button
              onClick={handlePrintAudit}
              variant="outline"
              className="w-full justify-start"
            >
              <CalendarRange className="mr-2 h-4 w-4" />
              Audit Summary (Week & Month)
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Firebase Integration */}
      {!isConfigured ? (
        <Card>
          <CardHeader>
            <CardTitle>Cloud Sync (Optional)</CardTitle>
            <CardDescription>
              Firebase is not configured. The app works fully offline.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                To enable cloud sync, install the Firebase package and configure your environment variables.
                See <code className="text-xs">FIREBASE_SETUP.md</code> for instructions.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Cloud Sync</CardTitle>
            <CardDescription>
              {isAuthenticated
                ? `Signed in as ${user?.email || 'user'} (${role})`
                : 'Sign in to sync your data to the cloud'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {authLoading ? (
              <p className="text-sm text-muted-foreground">Loading authentication...</p>
            ) : isAuthenticated ? (
              <>
                {/* Sync Status */}
                {syncStatus.lastSyncTime && (
                  <div className="rounded-lg border p-3 text-sm">
                    <p className="font-medium">
                      Last sync: {new Date(syncStatus.lastSyncTime).toLocaleString()}
                    </p>
                    <p className={syncStatus.lastSyncResult === 'success' ? 'text-success' : 'text-destructive'}>
                      {syncStatus.lastSyncMessage || 'Unknown status'}
                    </p>
                  </div>
                )}

                {/* Manual Sync Button */}
                <Button
                  onClick={handleManualSync}
                  disabled={isSyncing || !isOnline}
                  className="w-full"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Button>

                {!isOnline && (
                  <Alert>
                    <AlertDescription>
                      You are currently offline. Sync will resume when you're back online.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Sign Out Button */}
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                {/* Auth Mode Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={authMode === 'signin' ? 'default' : 'outline'}
                    onClick={() => setAuthMode('signin')}
                    className="flex-1"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                  <Button
                    variant={authMode === 'signup' ? 'default' : 'outline'}
                    onClick={() => setAuthMode('signup')}
                    className="flex-1"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                  </Button>
                </div>

                {/* Auth Form */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isAuthenticating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isAuthenticating}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAuth();
                        }
                      }}
                    />
                  </div>

                  {authError && (
                    <Alert variant="destructive">
                      <AlertDescription>{authError}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleAuth}
                    disabled={isAuthenticating}
                    className="w-full"
                  >
                    {isAuthenticating
                      ? 'Processing...'
                      : authMode === 'signin'
                      ? 'Sign In'
                      : 'Create Account'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Staff Management - ADMIN only */}
      {role === 'ADMIN' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Management
            </CardTitle>
            <CardDescription>
              Manage staff accounts and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleStaffManagement}
              variant="outline"
              className="w-full justify-start"
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Staff
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
