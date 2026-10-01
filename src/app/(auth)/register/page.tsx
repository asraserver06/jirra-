"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { registerUser } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Layers, ArrowRight, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { status, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'lead' | 'developer' | 'viewer'>('developer');

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/board');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resultAction = await dispatch(registerUser({ name, email, password, role }));
    if (registerUser.fulfilled.match(resultAction)) {
      router.push('/board');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0747A6]/5 via-background to-background p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#0052CC] text-white shadow-md mb-3">
            <Layers className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Join Jira Cloud
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Create your account to start collaborating with your team
          </p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-bold">Create your Jira account</CardTitle>
            <CardDescription className="text-xs">
              Fill in your details below to register
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded border border-red-200 dark:border-red-900">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Smith"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1">
                  Project Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                >
                  <option value="developer" className="dark:bg-slate-900">Developer (Build & close tickets)</option>
                  <option value="lead" className="dark:bg-slate-900">Tech Lead (Manage sprint & reviews)</option>
                  <option value="admin" className="dark:bg-slate-900">Admin (Full project control)</option>
                  <option value="viewer" className="dark:bg-slate-900">Viewer (Read-only stakeholder)</option>
                </select>
              </div>

              <Button
                type="submit"
                variant="jira"
                className="w-full mt-2 font-bold"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  'Creating account...'
                ) : (
                  <>
                    Sign Up <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pt-0 flex justify-center text-xs text-muted-foreground border-t border-border/50 py-3">
            Already have an account?{' '}
            <Link href="/login" className="ml-1 text-[#0052CC] font-bold hover:underline">
              Log in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
