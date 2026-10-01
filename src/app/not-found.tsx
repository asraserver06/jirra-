import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60 text-[#0052CC] mb-4">
        <Compass className="h-8 w-8" />
      </div>
      <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">
        404 — Issue or Page Not Found
      </h2>
      <p className="max-w-md text-sm text-muted-foreground mb-6">
        The Jira ticket, sprint board, or resource you are searching for does not exist or may have been archived.
      </p>
      <Link href="/board">
        <Button variant="jira">Go to Project Board</Button>
      </Link>
    </div>
  );
}
