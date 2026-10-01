import type { Metadata } from 'next';
import './globals.css';
import StoreProvider from '@/store/StoreProvider';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Jira Cloud — Agile Project Management & Issue Tracking',
  description: 'Streamline team velocity with Next.js App Router, shadcn/ui, Redux Toolkit, and high-performance Express REST backend with MongoDB.',
  keywords: ['Jira', 'Agile', 'Kanban', 'Scrum', 'Next.js', 'shadcn/ui', 'Redux Toolkit', 'Express', 'MongoDB'],
  authors: [{ name: 'Jira Engineering Team' }],
  openGraph: {
    title: 'Jira Cloud — Agile Project Management',
    description: 'Collaborate, plan sprints, and ship software with speed.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-blue-500 selection:text-white">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <StoreProvider>
            {children}
            <Toaster />
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
