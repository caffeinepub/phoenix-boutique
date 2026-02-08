/**
 * ADMIN-only Audit Logs screen that reads and lists recent /auditLogs entries from Firestore in reverse chronological order with clear English states for unconfigured/empty scenarios.
 */

import { useEffect, useState } from 'react';
import { ScreenTitle } from '../shared/ui/ScreenTitle';
import { useRole } from '../rbac/useRole';
import { useFirebase } from '../firebase/FirebaseProvider';
import { useFirebaseAuth } from '../firebase/useFirebaseAuth';
import { readAuditLogs, type AuditLogDocument } from '../firebase/auditLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export function AuditLogsScreen() {
  const { role } = useRole();
  const { isConfigured } = useFirebase();
  const { isAuthenticated, loading: authLoading } = useFirebaseAuth();
  const [logs, setLogs] = useState<AuditLogDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = async () => {
    if (!isConfigured || !isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const auditLogs = await readAuditLogs(100);
      setLogs(auditLogs);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadLogs();
    }
  }, [isConfigured, isAuthenticated, authLoading]);

  // Access denied for non-ADMIN
  if (role !== 'ADMIN') {
    return (
      <div className="space-y-4">
        <ScreenTitle>Audit Logs</ScreenTitle>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Audit logs are restricted to administrators only.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Firestore not configured
  if (!isConfigured) {
    return (
      <div className="space-y-4">
        <ScreenTitle>Audit Logs</ScreenTitle>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Cloud features are not configured. Audit logs require Firebase Firestore to be set up.
            See <code className="text-xs">FIREBASE_SETUP.md</code> for instructions.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="space-y-4">
        <ScreenTitle>Audit Logs</ScreenTitle>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please sign in to view audit logs. Go to Reports to authenticate.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="space-y-4">
        <ScreenTitle>Audit Logs</ScreenTitle>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Loading Audit Logs...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <ScreenTitle>Audit Logs</ScreenTitle>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadLogs} variant="outline" className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  // Empty state
  if (logs.length === 0) {
    return (
      <div className="space-y-4">
        <ScreenTitle>Audit Logs</ScreenTitle>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                No audit logs yet. Actions like creating, updating, or deleting orders will be logged here.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getActionLabel = (action: string): string => {
    switch (action) {
      case 'order_created':
        return 'Order Created';
      case 'order_updated':
        return 'Order Updated';
      case 'payment_updated':
        return 'Payment Updated';
      case 'order_deleted':
        return 'Order Deleted';
      default:
        return action;
    }
  };

  const getActionVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (action) {
      case 'order_created':
        return 'default';
      case 'order_updated':
        return 'secondary';
      case 'payment_updated':
        return 'outline';
      case 'order_deleted':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <ScreenTitle>Audit Logs</ScreenTitle>
        <Button onClick={loadLogs} variant="ghost" size="sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Activity ({logs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-3">
              {logs.map((log) => (
                <Card key={log.id} className="shadow-soft">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant={getActionVariant(log.action)}>
                          {getActionLabel(log.action)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {log.timestamp ? format(new Date(log.timestamp), 'PPp') : 'Unknown time'}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Order ID:</span> {log.orderId}
                          {log.localId && <span className="text-muted-foreground"> (#{log.localId})</span>}
                        </p>
                        <p>
                          <span className="font-medium">Actor:</span>{' '}
                          {log.actorEmail || log.actorUid}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {log.actorRole}
                          </Badge>
                        </p>
                        
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-2 rounded-md bg-muted p-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Details:</p>
                            <div className="space-y-1 text-xs">
                              {log.details.mode && (
                                <p><span className="font-medium">Mode:</span> {log.details.mode}</p>
                              )}
                              {log.details.resultingAdvancePaid !== undefined && (
                                <p><span className="font-medium">Advance Paid:</span> ₹{log.details.resultingAdvancePaid}</p>
                              )}
                              {log.details.amountChanged !== undefined && (
                                <p><span className="font-medium">Amount Changed:</span> ₹{log.details.amountChanged}</p>
                              )}
                              {log.details.paymentMethod && (
                                <p><span className="font-medium">Payment Method:</span> {log.details.paymentMethod}</p>
                              )}
                              {log.details.auditNote && (
                                <p><span className="font-medium">Note:</span> {log.details.auditNote}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
