"use client";

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled App Router Error:', error);
  }, [error]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 mb-4">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
        Something went wrong!
      </h2>
      <p className="max-w-md text-sm text-muted-foreground mb-6">
        {error.message || 'An unexpected error occurred while loading this Jira view.'}
      </p>
      <div className="flex gap-3">
        <Button onClick={() => reset()} variant="jira" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
        <Button onClick={() => window.location.href = '/board'} variant="outline">
          Return to Board
        </Button>
      </div>
    </div>
  );
}
