"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import { useAppDispatch, useAppSelector } from '@/store';
import { registerUser, googleLogin } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ArrowRight, AlertCircle } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-foreground text-background shadow-md mb-3 font-extrabold text-xl">
            T
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Join TaskFlow
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Create your account to start collaborating with your team
          </p>
        </div>

        <Card className="border border-border/80 shadow-xl rounded-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-bold">Create your TaskFlow account</CardTitle>
            <CardDescription className="text-xs">
              Fill in your details below to register
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
                  Or sign up with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Smith"
                  className="rounded-xl"
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
                  className="rounded-xl"
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
                  className="rounded-xl"
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
                  className="w-full h-9 rounded-xl border border-input bg-transparent px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                >
                  <option value="developer" className="bg-card text-card-foreground">Developer (Build & close tickets)</option>
                  <option value="lead" className="bg-card text-card-foreground">Tech Lead (Manage sprint & reviews)</option>
                  <option value="admin" className="bg-card text-card-foreground">Admin (Full project control)</option>
                  <option value="viewer" className="bg-card text-card-foreground">Viewer (Read-only stakeholder)</option>
                </select>
              </div>

              <Button
                type="submit"
                className="w-full mt-2 font-semibold rounded-xl"
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
            <Link href="/login" className="ml-1 text-primary font-bold hover:underline">
              Log in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
