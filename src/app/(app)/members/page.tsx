"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import {
  Users,
  UserPlus,
  Mail,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Clock,
  X,
  Crown,
  Send,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchMembers,
  fetchPendingInvites,
  sendInvites,
  removeMember,
  revokeInvite,
  resendInvite,
  WorkspaceMember,
  PendingInvite,
} from '@/store/slices/workspaceSlice';

// ── Invite Dialog ────────────────────────────────────────────────────────────
function InviteDialog({
  workspaceId,
  onClose,
  onDone,
}: {
  workspaceId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const dispatch = useAppDispatch();
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailList = emails
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!emailList.length) {
      toast.error('Enter at least one email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const bad = emailList.filter((e) => !emailRegex.test(e));
    if (bad.length) {
      toast.error(`Invalid: ${bad.join(', ')}`);
      return;
    }

    setLoading(true);
    const result = await dispatch(sendInvites({ workspaceId, emails: emailList, role }));
    setLoading(false);

    if (sendInvites.fulfilled.match(result)) {
      const results = result.payload as any[];
      const ok = results.filter((r) => r.status === 'success').length;
      const fail = results.filter((r) => r.status === 'failed').length;
      if (ok > 0 && fail === 0) toast.success(`${ok} invite(s) sent!`);
      else if (ok > 0) toast.success(`${ok} sent, ${fail} failed (already invited/member).`);
      else toast.error('All invitations failed.');
      onDone();
      onClose();
    } else {
      toast.error((result.payload as string) || 'Failed to send invites.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 10, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Invite Members</h2>
              <p className="text-xs text-muted-foreground">They'll receive an email link to join.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-5">
          {/* Emails */}
          <div>
            <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
              Email Addresses
            </label>
            <textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground p-3 focus:outline-none focus:ring-2 focus:ring-ring/60 resize-none transition"
              placeholder="jane@example.com, john@example.com&#10;(comma or newline separated)"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
              Role
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
                className="w-full appearance-none rounded-xl border border-border bg-muted/40 text-sm text-foreground py-2.5 pl-3 pr-9 focus:outline-none focus:ring-2 focus:ring-ring/60 transition"
              >
                <option value="member">Team Member — can view and collaborate on issues (Default)</option>
                <option value="admin">Admin — can manage workspace and invite members</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? 'Sending…' : 'Send Invites'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Members Page ─────────────────────────────────────────────────────────────
export default function MembersPage() {
  const dispatch = useAppDispatch();
  const { current: workspace, myRole, members, pendingInvites, membersStatus, invitesStatus } =
    useAppSelector((state) => state.workspace);
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = myRole === 'admin';
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    if (workspace?._id) {
      dispatch(fetchMembers(workspace._id));
      if (isAdmin) dispatch(fetchPendingInvites(workspace._id));
    }
  }, [workspace?._id, isAdmin, dispatch]);

  const refreshAll = () => {
    if (!workspace?._id) return;
    dispatch(fetchMembers(workspace._id));
    if (isAdmin) dispatch(fetchPendingInvites(workspace._id));
  };

  const handleRemove = async (member: WorkspaceMember) => {
    if (!workspace?._id) return;
    if (!confirm(`Remove ${member.user.name} from this workspace?`)) return;
    setRemovingId(member.user.id);
    const result = await dispatch(removeMember({ workspaceId: workspace._id, userId: member.user.id }));
    setRemovingId(null);
    if (removeMember.fulfilled.match(result)) toast.success(`${member.user.name} removed.`);
    else toast.error((result.payload as string) || 'Failed to remove member.');
  };

  const handleRevoke = async (invite: PendingInvite) => {
    if (!workspace?._id) return;
    setRevokingId(invite._id);
    const result = await dispatch(revokeInvite({ workspaceId: workspace._id, inviteId: invite._id }));
    setRevokingId(null);
    if (revokeInvite.fulfilled.match(result)) toast.success('Invite revoked.');
    else toast.error((result.payload as string) || 'Failed to revoke.');
  };

  const handleResend = async (invite: PendingInvite) => {
    if (!workspace?._id) return;
    setResendingId(invite._id);
    const result = await dispatch(resendInvite({ workspaceId: workspace._id, inviteId: invite._id }));
    setResendingId(null);
    if (resendInvite.fulfilled.match(result)) toast.success('Invite resent.');
    else toast.error((result.payload as string) || 'Failed to resend.');
  };

  const isLoading = membersStatus === 'loading' || invitesStatus === 'loading';

  return (
    <>
      <Toaster position="top-right" />

      <div className="space-y-6 max-w-4xl mx-auto w-full pb-12">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-violet-500" />
              Members
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {workspace?.name ? `${workspace.name} workspace` : 'Workspace'} · {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshAll}
              disabled={isLoading}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowInviteDialog(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                Invite Members
              </button>
            )}
          </div>
        </div>

        {/* Members List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">Active Members</span>
            <span className="ml-auto text-xs text-muted-foreground font-medium">
              {members.length} total
            </span>
          </div>

          {membersStatus === 'loading' ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <Users className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No members yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Invite people to join your workspace.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {members.map((member) => {
                const isSelf = member.user.id === user?.id || member.user.email === user?.email;
                const memberIsAdmin = member.role === 'admin';
                return (
                  <motion.li
                    key={member._id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors group"
                  >
                    {/* Avatar */}
                    {member.user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.user.avatar}
                        alt={member.user.name}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-border shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/15 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                        {member.user.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {member.user.name}
                        </span>
                        {isSelf && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate">{member.user.email}</span>
                    </div>

                    {/* Role Badge */}
                    <div
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${
                        memberIsAdmin
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {memberIsAdmin ? <ShieldCheck className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </div>

                    {/* Remove Button — admin only, can't remove self */}
                    {isAdmin && !isSelf && (
                      <button
                        onClick={() => handleRemove(member)}
                        disabled={removingId === member.user.id}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-40"
                        title={`Remove ${member.user.name}`}
                      >
                        {removingId === member.user.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Pending Invites — admin only */}
        {isAdmin && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
              <Mail className="w-4 h-4 text-violet-500" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">Pending Invites</span>
              {pendingInvites.length > 0 && (
                <span className="ml-auto text-xs font-medium bg-violet-500/15 text-violet-600 px-2 py-0.5 rounded-full">
                  {pendingInvites.length}
                </span>
              )}
            </div>

            {invitesStatus === 'loading' ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-7 h-7 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
              </div>
            ) : pendingInvites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <Mail className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No pending invites</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Use the Invite button to bring teammates on board.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                <AnimatePresence initial={false}>
                  {pendingInvites.map((invite) => (
                    <motion.li
                      key={invite._id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-4 px-5 py-3.5 group"
                    >
                      <div className="w-9 h-9 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-violet-500" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{invite.email}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3 text-muted-foreground/60" />
                          <span className="text-[11px] text-muted-foreground">
                            Expires {new Date(invite.expiresAt).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                            Role: {invite.role === 'admin' ? 'Admin' : 'Team Member'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleResend(invite)}
                          disabled={resendingId === invite._id}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-violet-600 hover:bg-violet-500/10 transition-colors disabled:opacity-40"
                          title="Resend invite"
                        >
                          {resendingId === invite._id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          Resend
                        </button>
                        <button
                          onClick={() => handleRevoke(invite)}
                          disabled={revokingId === invite._id}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                          title="Revoke invite"
                        >
                          {revokingId === invite._id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                          Revoke
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        )}

        {/* Non-admin info note */}
        {!isAdmin && (
          <div className="flex items-start gap-3 p-4 bg-muted/50 border border-border/60 rounded-xl text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <span>Only workspace Admins can invite or remove members.</span>
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      <AnimatePresence>
        {showInviteDialog && workspace?._id && (
          <InviteDialog
            workspaceId={workspace._id}
            onClose={() => setShowInviteDialog(false)}
            onDone={refreshAll}
          />
        )}
      </AnimatePresence>
    </>
  );
}
