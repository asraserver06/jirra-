"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import { useAppDispatch, useAppSelector } from '@/store';
import { loginUser, googleLogin } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Layers, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { status, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('alex.morgan@acme-taskflow.io');
  const [password, setPassword] = useState('jira1234');

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/board');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resultAction = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(resultAction)) {
      router.push('/board');
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('jira1234');
    dispatch(loginUser({ email: demoEmail, password: 'jira1234' })).then((res) => {
      if (loginUser.fulfilled.match(res)) {
        router.push('/board');
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* TaskFlow Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-foreground text-background shadow-md mb-3 font-extrabold text-xl">
            T
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            TaskFlow
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Sign in to your team workspace
          </p>
        </div>

        <Card className="border border-border/80 shadow-xl rounded-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-bold">Log in to your account</CardTitle>
            <CardDescription className="text-xs">
              Enter your credentials to access project boards
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs bg-destructive/10 text-destructive rounded-xl border border-destructive/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (credentialResponse.credential) {
                    const res = await dispatch(googleLogin(credentialResponse.credential));
                    if (googleLogin.fulfilled.match(res)) {
                      router.push('/board');
                    }
                  }
                }}
                onError={() => {
                  console.error('Google Sign-In failed');
                }}
                useOneTap
              />
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground font-semibold">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="rounded-xl"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-foreground/80">
                    Password
                  </label>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-2 font-semibold rounded-xl"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  'Signing in...'
                ) : (
                  <>
                    Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </form>

            {/* Quick Demo Logins */}
            <div className="pt-3 border-t border-border/60">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                1-Click Demo Accounts:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('alex.morgan@acme-taskflow.io')}
                  className="p-2 text-left rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-xs"
                >
                  <div className="font-semibold text-foreground flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Alex (Admin)
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">alex.morgan@...</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('sarah.connor@acme-taskflow.io')}
                  className="p-2 text-left rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-xs"
                >
                  <div className="font-semibold text-foreground flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Sarah (Lead)
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">sarah.connor@...</div>
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-0 flex justify-center text-xs text-muted-foreground border-t border-border/50 py-3">
            Don't have an account?{' '}
            <Link href="/register" className="ml-1 text-primary font-bold hover:underline">
              Create account
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
