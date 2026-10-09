"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import { useAppDispatch, useAppSelector } from '@/store';
import { loginUser, googleLogin } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useGoogleAuthAvailability } from '@/hooks/useGoogleAuthAvailability';
import { ArrowRight, AlertCircle, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
// Accept the pending invite after logging in
async function acceptPendingInvite(token: string, accessToken: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/invites/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    return { success: res.ok && data.success, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

function LoginContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { status, error, isAuthenticated } = useAppSelector((state) => state.auth);
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('inviteToken');
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState(emailParam || '');
  const [password, setPassword] = useState('');
  const googleAvailability = useGoogleAuthAvailability();
  const [googleFailed, setGoogleFailed] = useState(false);

  React.useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/board');
    }
  }, [isAuthenticated, router]);

  const afterLogin = async (accessToken: string) => {
    if (inviteToken) {
      const result = await acceptPendingInvite(inviteToken, accessToken);
      if (result.success) {
        toast.success('Invitation accepted! Welcome to the workspace.');
      } else if (result.message && !result.message.toLowerCase().includes('already a member')) {
        toast.error(result.message);
      }
    }
    router.push('/board');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      await afterLogin(result.payload.accessToken);
    }
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
            {inviteToken ? 'Sign in to accept your workspace invitation' : 'Sign in to your team workspace'}
          </p>
        </div>

        {/* Invite banner */}
        {inviteToken && (
          <div className="flex items-center gap-2.5 p-3 bg-violet-500/10 border border-violet-500/30 rounded-xl text-xs text-violet-700 dark:text-violet-300 font-medium">
            <Mail className="w-4 h-4 shrink-0" />
            You have a pending workspace invitation. Log in to accept it.
          </div>
        )}

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
              {googleAvailability === 'enabled' && !googleFailed ? (
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (credentialResponse.credential) {
                    const res = await dispatch(googleLogin({
                      credential: credentialResponse.credential,
                      inviteToken: inviteToken || undefined,
                    }));
                    if (googleLogin.fulfilled.match(res)) {
                      if (res.payload.status === 'needs_signup') {
                        window.sessionStorage.setItem('google_signup_ticket', res.payload.signupTicket);
                        const params = new URLSearchParams({
                          email: res.payload.email,
                          name: res.payload.name,
                        });
                        router.push(`/register?${params.toString()}`);
                      } else if (res.payload.status === 'needs_invite') {
                        const params = new URLSearchParams();
                        if (res.payload.inviteToken) params.set('token', res.payload.inviteToken);
                        params.set('email', res.payload.email);
                        router.push(`/invite/accept?${params.toString()}`);
                      } else if (inviteToken) {
                        toast.success('Invitation accepted! Welcome to the workspace.');
                        router.push('/board');
                      } else {
                        await afterLogin(res.payload.accessToken);
                      }
                    } else {
                      setGoogleFailed(true);
                      toast.error((res.payload as string) || 'Google sign-in failed. Please try again.');
                    }
                  } else {
                    setGoogleFailed(true);
                    toast.error('Google did not return a sign-in credential. Please try again.');
                  }
                }}
                onError={() => {
                  setGoogleFailed(true);
                  toast.error('Google sign-in failed. You can still sign in with email and password.');
                }}
              />
              ) : googleAvailability === 'loading' ? (
                <p className="text-xs text-muted-foreground text-center">Checking Google sign-in availability…</p>
              ) : (
                <p className="text-xs text-muted-foreground text-center">
                  {googleAvailability === 'error'
                    ? 'Google sign-in is temporarily unavailable. You can still sign in with email and password.'
                    : googleFailed
                      ? 'Google sign-in is unavailable right now. You can still sign in with email and password.'
                      : 'Google sign-in is not configured. You can still sign in with email and password.'}
                </p>
              )}
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

          </CardContent>

          <CardFooter className="pt-0 flex justify-center text-xs text-muted-foreground border-t border-border/50 py-3">
            Don&apos;t have an account?{' '}
            <Link
              href={inviteToken ? `/invite/accept?token=${inviteToken}` : '/register'}
              className="ml-1 text-primary font-bold hover:underline"
            >
              {inviteToken ? 'Accept Invitation' : 'Create account'}
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
