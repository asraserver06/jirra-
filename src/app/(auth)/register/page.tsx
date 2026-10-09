"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { registerUser } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  Target,
  Sparkles,
  Shield,
  Layers,
  Briefcase,
  Users2,
  Mail,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const POPULAR_GOALS = [
  { id: 'team_tasks', label: 'Manage team tasks', icon: Users2, desc: 'Coordinate day-to-day work across your team' },
  { id: 'projects', label: 'Run agile projects', icon: Layers, desc: 'Sprints, backlogs, and milestone tracking' },
  { id: 'freelance', label: 'Freelance & client work', icon: Briefcase, desc: 'Deliver projects for multiple stakeholders' },
  { id: 'engineering', label: 'Software development', icon: Sparkles, desc: 'Bug triage, feature roadmaps, and PR tracking' },
];

function RegisterContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { status, error, isAuthenticated } = useAppSelector((state) => state.auth);
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('inviteToken');

  // Step 1: Admin Account Details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2: Workspace Setup
  const [step, setStep] = useState<1 | 2>(1);
  const [workspaceName, setWorkspaceName] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<string>('Manage team tasks');
  const [customGoal, setCustomGoal] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/board');
    }
  }, [isAuthenticated, router]);

  // When stepping into step 2, prefill workspace name if empty
  const handleProceedToWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!firstName.trim()) {
      setLocalError('First name is required.');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (!workspaceName.trim()) {
      setWorkspaceName(`${firstName.trim()}'s Workspace`);
    }

    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!workspaceName.trim()) {
      setLocalError('Please enter an organization or workspace name.');
      return;
    }

    const finalGoal = customGoal.trim() ? customGoal.trim() : selectedGoal;

    const resultAction = await dispatch(
      registerUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        workspaceName: workspaceName.trim(),
        goal: finalGoal,
      })
    );

    if (registerUser.fulfilled.match(resultAction)) {
      toast.success('Workspace created! Welcome to TaskFlow.');
      router.push('/board');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-xl space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-foreground text-background shadow-md mb-3 font-extrabold text-xl">
            T
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            TaskFlow for Organizations
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            Create your Admin account to set up your team&apos;s workspace and manage projects
          </p>
        </div>

        {/* Invite notice banner if someone with an invite token landed here */}
        {inviteToken && (
          <div className="flex items-center justify-between p-3.5 bg-violet-500/10 border border-violet-500/30 rounded-2xl text-xs text-violet-700 dark:text-violet-300 font-medium">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0 text-violet-500" />
              <span>You have a workspace invite token.</span>
            </div>
            <Link
              href={`/invite/accept?token=${inviteToken}`}
              className="text-xs font-bold text-violet-600 dark:text-violet-400 underline hover:opacity-80"
            >
              Accept Invitation →
            </Link>
          </div>
        )}

        <Card className="border border-border/80 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xs">
          {/* Progress / Step Indicators */}
          <div className="bg-muted/40 px-6 py-3 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                  step === 1
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                {step === 2 ? '✓' : '1'}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  {step === 1 ? '1. Admin Account' : '2. Workspace Setup'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {step === 1 ? 'Owner profile credentials' : 'Organization name and goal'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Admin Setup</span>
            </div>
          </div>

          <CardHeader className="space-y-1 pb-4 pt-6 px-6">
            <CardTitle className="text-lg font-bold text-foreground">
              {step === 1 ? 'Set up your Administrator Account' : 'Configure your Team Workspace'}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {step === 1
                ? 'As an Admin, you will have full control to configure boards, invite team members, and view analytics.'
                : 'Define your workspace name and what your organization aims to achieve.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-6 pb-6">
            {(error || localError) && (
              <div className="flex items-center gap-2 p-3 text-xs bg-destructive/10 text-destructive rounded-xl border border-destructive/20 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{localError || error}</span>
              </div>
            )}

            {/* STEP 1: ADMIN ACCOUNT FORM */}
            {step === 1 && (
              <form onSubmit={handleProceedToWorkspace} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground/80 block mb-1">
                      First Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Alex"
                      className="rounded-xl h-10"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground/80 block mb-1">
                      Last Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Morgan"
                      className="rounded-xl h-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground/80 block mb-1">
                    Work Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="rounded-xl h-10"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    We will send a welcome email and workspace confirmation to this address.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground/80 block mb-1">
                    Password <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="rounded-xl h-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground/80 block mb-1">
                    Confirm Password <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="rounded-xl h-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full font-bold h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-md transition-all"
                  >
                    Continue to Workspace Setup <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 2: WORKSPACE SETUP FORM */}
            {step === 2 && (
              <form onSubmit={handleFinalSubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5 mb-1.5">
                    <Building2 className="w-4 h-4 text-violet-500" />
                    Organization or Workspace Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="e.g. Acme Studio, Product Engineering"
                    className="rounded-xl h-10 text-sm font-medium"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Your team members will see this name when joining and working on tasks.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5 mb-2">
                    <Target className="w-4 h-4 text-violet-500" />
                    Primary Goal or Use Case
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {POPULAR_GOALS.map((goalItem) => {
                      const Icon = goalItem.icon;
                      const isSelected = selectedGoal === goalItem.label && !customGoal.trim();
                      return (
                        <div
                          key={goalItem.id}
                          onClick={() => {
                            setSelectedGoal(goalItem.label);
                            setCustomGoal('');
                          }}
                          className={`cursor-pointer p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-violet-600 bg-violet-500/10 text-foreground ring-1 ring-violet-600/50'
                              : 'border-border/70 hover:border-border hover:bg-muted/40 text-muted-foreground'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-violet-600' : 'text-muted-foreground'}`} />
                              {goalItem.label}
                            </span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-violet-600" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-tight">
                            {goalItem.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3">
                    <Input
                      type="text"
                      value={customGoal}
                      onChange={(e) => setCustomGoal(e.target.value)}
                      placeholder="Or enter another custom goal / use case..."
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setLocalError(null);
                      setStep(1);
                    }}
                    className="rounded-xl h-11 px-4 font-semibold text-xs"
                    disabled={status === 'loading'}
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
                  </Button>

                  <Button
                    type="submit"
                    className="flex-1 font-bold h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-md transition-all"
                    disabled={status === 'loading'}
                  >
                    {status === 'loading' ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating Workspace...
                      </span>
                    ) : (
                      <>
                        Launch Workspace <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>

          <CardFooter className="pt-0 flex justify-center text-xs text-muted-foreground border-t border-border/50 py-3 bg-muted/20">
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
