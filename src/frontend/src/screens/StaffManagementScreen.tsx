/**
 * ADMIN-only Staff Management screen.
 * Shows placeholder management UI for authenticated admins.
 */

import { ScreenTitle } from '../shared/ui/ScreenTitle';
import { useNavigation } from '../navigation/NavigationProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Users, AlertCircle } from 'lucide-react';
import { useFirebase } from '../firebase/FirebaseProvider';
import { useFirebaseAuth } from '../firebase/useFirebaseAuth';

export function StaffManagementScreen() {
  const { navigateTo } = useNavigation();
  const { isConfigured } = useFirebase();
  const { isAuthenticated } = useFirebaseAuth();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateTo('reports')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <ScreenTitle>Staff Management</ScreenTitle>
      </div>

      {!isConfigured || !isAuthenticated ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Staff management requires an authenticated ADMIN account. Please configure Firebase and sign in to use this feature.
          </AlertDescription>
        </Alert>
      ) : (
        <Card className="shadow-soft">
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
            <p className="text-sm text-muted-foreground">
              Staff management features will be available here. This is a placeholder for future functionality.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
