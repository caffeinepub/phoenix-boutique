/**
 * Reusable access-denied view for restricted screens reached via navigation.
 * Shows English-only message when STAFF tries to access ADMIN-only screens.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { useNavigation } from '../../navigation/NavigationProvider';

interface AccessDeniedScreenProps {
  title?: string;
  message?: string;
}

export function AccessDeniedScreen({
  title = 'Access Denied',
  message = 'You do not have permission to access this feature. This area is restricted to administrators only.',
}: AccessDeniedScreenProps) {
  const { navigateTo } = useNavigation();

  return (
    <div className="space-y-4">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-6 w-6" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{message}</p>
          <Button onClick={() => navigateTo('dashboard')} variant="outline" className="w-full">
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
