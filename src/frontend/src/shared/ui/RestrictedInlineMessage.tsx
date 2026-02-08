/**
 * Reusable inline message component for restricted/disabled areas.
 * Shows English-only messages when features require ADMIN access.
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface RestrictedInlineMessageProps {
  message?: string;
}

export function RestrictedInlineMessage({ message = 'This feature requires ADMIN access' }: RestrictedInlineMessageProps) {
  return (
    <Alert variant="default" className="bg-muted/50">
      <Lock className="h-4 w-4" />
      <AlertDescription className="text-sm text-muted-foreground">
        {message}
      </AlertDescription>
    </Alert>
  );
}
