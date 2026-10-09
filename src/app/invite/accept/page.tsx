'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch } from '@/store';
import { logout, setCredentials } from '@/store/slices/authSlice';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Lock,
  Eye,
  EyeOff,
  Building2,
  ArrowLeft,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Shield,
  Users,
  Sparkles,
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

interface InviteData {
  email: string;
  workspaceName: string;
  workspaceId: string;
  inviterName?: string;
  role: 'member' | 'admin';
  userExists: boolean;
  expiresAt: string;
}

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(true);
  const [validatingError, setValidatingError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Validate token on load
  useEffect(() => {
    if (!token) {
      const invitedEmail = searchParams.get('email');
      setValidatingError(
        invitedEmail
          ? `A workspace invitation exists for ${invitedEmail}. Please open the original invitation email link to continue.`
          : 'Missing invitation token. Please check the link from your email.'
      );
      setLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await api.get('/api/invites/validate', { params: { token } });
        const json = response.data;

        if (!json.success) {
          setValidatingError(json.message || 'This invitation link is invalid or has expired.');
          setLoading(false);
          return;
        }

        setInviteData(json.data);
      } catch (error: unknown) {
        setValidatingError(apiErrorMessage(error, 'Failed to connect to the authentication server.'));
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [searchParams, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!firstName.trim()) {
      setFormError('First name is required.');
      return;
    }
    if (!lastName.trim()) {
      setFormError('Last name is required.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    dispatch(logout());

    try {
      const response = await api.post('/api/invites/accept', {
          token,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          password,
      });

      const data = response.data;

      if (!data.success) {
        setFormError(data.message || 'Failed to accept invitation.');
        setSubmitting(false);
        return;
      }

      // Log them in immediately and redirect to workspace dashboard
      if (data.data?.accessToken && data.data?.user) {
        dispatch(
          setCredentials({
            user: data.data.user,
            token: data.data.accessToken,
          })
        );
      }

      toast.success(`Welcome to ${inviteData?.workspaceName || 'the workspace'}!`);
      router.push('/board');
    } catch (error: unknown) {
      setFormError(apiErrorMessage(error, 'Network error accepting invitation.'));
      setSubmitting(false);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-violet-600 border-t-transparent animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold">Validating your invitation link…</p>
        </div>
      </div>
    );
  }

  // 2. Error State (Invalid / Expired / Revoked)
  if (validatingError || !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-3xl shadow-2xl p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto ring-8 ring-destructive/5">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-foreground tracking-tight">
              Invitation Link Invalid
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {validatingError || 'This invitation has expired, was revoked by an admin, or has already been used.'}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/login"
              className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all text-center shadow-sm"
            >
              Sign In to TaskFlow
            </Link>
            <Link
              href="/register"
              className="w-full py-2.5 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-all text-center"
            >
              Create New Workspace (Admin)
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const roleLabel = inviteData.role === 'admin' ? 'Admin' : 'Team Member';

  // 3. Main Two-Column Layout
  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <Toaster position="top-right" />

      {/* Floating Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* LEFT COLUMN: Invitation Accept Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-16 max-w-xl mx-auto lg:max-w-none">
        <div>
          {/* Top Header: Logo & Back Link */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-2.5 select-none group">
              <div className="w-9 h-9 bg-foreground text-background rounded-xl font-extrabold flex items-center justify-center text-sm shadow-xs group-hover:scale-105 transition-transform duration-200">
                T
              </div>
              <span className="font-extrabold text-lg tracking-tight text-foreground">
                TaskFlow
              </span>
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>
          </div>

          {/* Workspace Invitation Heading & Role Badge */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  Join {inviteData.workspaceName}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Create your account to join this organization.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
              {inviteData.role === 'admin' ? (
                <Shield className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Users className="w-3.5 h-3.5 text-violet-600" />
              )}
              Role: {roleLabel}
            </div>
          </div>

          {/* Form Error Banner */}
          {formError && (
            <div className="flex items-center gap-2 p-3.5 mb-6 text-xs bg-destructive/10 text-destructive rounded-xl border border-destructive/20 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Account Creation Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Locked Read-Only Email */}
            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1">
                Email
              </label>
              <div className="relative">
                <Input
                  type="email"
                  value={inviteData.email}
                  readOnly
                  disabled
                  className="rounded-xl h-10 bg-muted/70 text-muted-foreground border-border/80 cursor-not-allowed pr-10 font-medium"
                />
                <Lock className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Invitation was issued specifically for this address and cannot be modified.
              </p>
            </div>

            {/* First and Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1">
                  First name <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Jordan"
                  className="rounded-xl h-10 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1">
                  Last name <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Smith"
                  className="rounded-xl h-10 text-sm"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1">
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="rounded-xl h-10 pr-10 text-sm"
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

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1">
                Confirm password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="rounded-xl h-10 pr-10 text-sm"
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

            {/* Submit Primary Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 font-bold text-sm rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-md transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Joining Workspace...
                  </span>
                ) : (
                  'Create account and join'
                )}
              </Button>
            </div>
          </form>

          {/* Already have access link */}
          <div className="text-center mt-6 pt-4 border-t border-border/50">
            <span className="text-xs text-muted-foreground">
              Already have access?{' '}
            </span>
            <Link
              href={`/login?inviteToken=${token}&email=${encodeURIComponent(inviteData.email)}`}
              className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center pt-8 text-[11px] text-muted-foreground">
          By joining, you agree to TaskFlow&apos;s Terms of Service and Privacy Policy.
        </div>
      </div>

      {/* RIGHT COLUMN: Illustration & Support Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-950 via-slate-900 to-indigo-950 text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Right Support Link */}
        <div className="flex justify-end relative z-10">
          <a
            href="mailto:support@taskflow.io"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors py-1.5 px-3 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-xs"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Contact Support
          </a>
        </div>

        {/* Center: Illustration & Welcome Copy */}
        <div className="max-w-md mx-auto text-center space-y-8 relative z-10 my-auto">
          {/* Custom Modern SVG Illustration */}
          <div className="relative mx-auto w-64 h-56 flex items-center justify-center">
            {/* Background workspace board card */}
            <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md shadow-2xl p-4 flex flex-col justify-between transform -rotate-2">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[10px] font-mono text-white/50">TaskFlow Board</span>
              </div>
              <div className="space-y-2 py-2">
                <div className="h-4 bg-white/15 rounded-md w-3/4" />
                <div className="h-4 bg-white/10 rounded-md w-1/2" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex -space-x-1.5">
                  <div className="w-5 h-5 rounded-full bg-violet-500 border border-white/20 text-[9px] flex items-center justify-center font-bold">A</div>
                  <div className="w-5 h-5 rounded-full bg-indigo-500 border border-white/20 text-[9px] flex items-center justify-center font-bold">M</div>
                  <div className="w-5 h-5 rounded-full bg-emerald-500 border border-white/20 text-[9px] flex items-center justify-center font-bold">+</div>
                </div>
                <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Workspace Invite
                </span>
              </div>
            </div>

            {/* Front floating badge */}
            <div className="absolute -bottom-3 -right-2 bg-gradient-to-r from-violet-600 to-indigo-600 border border-white/20 rounded-2xl p-3 shadow-xl flex items-center gap-2.5 transform rotate-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-white/70 font-medium">Team Invitation</p>
                <p className="text-xs font-bold text-white">Join Collaboration</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              You&apos;re invited to the team.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
              Accept your invitation to start collaborating with your organization.
            </p>
          </div>
        </div>

        {/* Bottom Workspace Badge */}
        <div className="relative z-10 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Building2 className="w-4 h-4 text-violet-400" />
          <span>Workspace: <strong className="text-white">{inviteData.workspaceName}</strong></span>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-10 h-10 rounded-full border-3 border-violet-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
