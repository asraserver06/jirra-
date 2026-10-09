import { Response } from 'express';
import { Workspace } from '../models/Workspace.js';
import { Invitation } from '../models/Invitation.js';
import { Membership } from '../models/Membership.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { sendSuccess } from '../utils/response.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { sendWorkspaceInviteEmail } from '../services/email.services.js';
import { generateInviteToken } from '../utils/inviteToken.js';
import { generateTokens, setRefreshCookie, clearRefreshCookie, publicUser } from '../utils/authTokens.js';
import { loadPendingInviteByToken } from '../services/invite.service.js';

const expireStaleInvites = async (workspaceId: string) => {
  await Invitation.updateMany(
    { workspace: workspaceId, status: 'pending', expiresAt: { $lt: new Date() } },
    { status: 'expired' }
  );
};

export const createInvites = async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.id as string;
  const emails: string[] = req.body.emails;
  const role: 'member' | 'admin' = req.body.role === 'admin' ? 'admin' : 'member';

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const uniqueEmails = [...new Set(emails.map((e) => e.toLowerCase().trim()))];
  const results: { email: string; status: 'success' | 'failed'; reason?: string }[] = [];

  for (const lowerEmail of uniqueEmails) {
    try {
      const user = await User.findOne({ email: lowerEmail });
      if (user) {
        const existingMember = await Membership.findOne({ workspace: workspaceId, user: user._id });
        if (existingMember) {
          results.push({ email: lowerEmail, status: 'failed', reason: 'Already a member' });
          continue;
        }
      }

      const existingInvite = await Invitation.findOne({
        workspace: workspaceId,
        email: lowerEmail,
        status: 'pending',
      });
      if (existingInvite) {
        results.push({ email: lowerEmail, status: 'failed', reason: 'Pending invite already exists' });
        continue;
      }

      const { token, tokenHash } = generateInviteToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await Invitation.create({
        workspace: workspaceId,
        email: lowerEmail,
        role,
        invitedBy: req.user!.id,
        tokenHash,
        status: 'pending',
        expiresAt,
      });

      await sendWorkspaceInviteEmail(lowerEmail, req.user!.name, workspace.name, token, role);

      results.push({ email: lowerEmail, status: 'success' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to invite';
      results.push({ email: lowerEmail, status: 'failed', reason: message });
    }
  }

  return sendSuccess(res, results, 'Invitations processed', 201);
};

export const getInvites = async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.id as string;
  await expireStaleInvites(workspaceId);

  const invites = await Invitation.find({ workspace: workspaceId, status: 'pending' })
    .populate('invitedBy', 'name email avatar')
    .sort('-createdAt');

  const data = invites.map((invite) => ({
    id: invite._id.toString(),
    _id: invite._id.toString(),
    email: invite.email,
    role: invite.role,
    status: invite.status,
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
    invitedBy: invite.invitedBy,
  }));

  return sendSuccess(res, data, 'Pending invitations retrieved');
};

export const resendInvite = async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.id as string;
  const inviteId = req.params.inviteId as string;

  const invite = await Invitation.findOne({ _id: inviteId, workspace: workspaceId, status: 'pending' });
  if (!invite) throw new AppError('Invitation not found or not pending', 404);

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const { token, tokenHash } = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  invite.tokenHash = tokenHash;
  invite.expiresAt = expiresAt;
  await invite.save();

  try {
    await sendWorkspaceInviteEmail(invite.email, req.user!.name, workspace.name, token, invite.role);
  } catch (error: any) {
    throw new AppError(`Failed to deliver invitation email: ${error?.message || 'SMTP error'}`, 500);
  }

  return sendSuccess(res, { id: invite._id.toString(), email: invite.email, expiresAt }, 'Invitation resent successfully');
};

export const revokeInvite = async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.id as string;
  const inviteId = req.params.inviteId as string;

  const invite = await Invitation.findOneAndUpdate(
    { _id: inviteId, workspace: workspaceId, status: 'pending' },
    { status: 'revoked' }
  );

  if (!invite) {
    throw new AppError('Invitation not found or already processed', 404);
  }

  return sendSuccess(res, null, 'Invitation revoked successfully');
};

export const validateInvite = async (req: AuthRequest, res: Response) => {
  const token = String(req.query.token || '');
  const invite = await loadPendingInviteByToken(token);
  const workspace = invite.workspace as unknown as { _id: { toString(): string }; name: string };
  const inviter = invite.invitedBy as unknown as { name?: string };
  const existingUser = await User.findOne({ email: invite.email });

  return sendSuccess(
    res,
    {
      email: invite.email,
      workspaceName: workspace?.name,
      workspaceId: workspace?._id ? workspace._id.toString() : '',
      inviterName: inviter?.name,
      role: invite.role,
      userExists: Boolean(existingUser),
      expiresAt: invite.expiresAt,
    },
    'Invitation is valid'
  );
};

export const previewInvite = validateInvite;

export const acceptInvite = async (req: AuthRequest, res: Response) => {
  clearRefreshCookie(res);
  const { token, name, firstName, lastName, password } = req.body;
  const invite = await loadPendingInviteByToken(token);
  const workspace = invite.workspace as unknown as { _id: { toString(): string }; name: string };

  const resolvedName = (firstName || lastName)
    ? `${firstName || ''} ${lastName || ''}`.trim()
    : (name || '').trim();

  let user = await User.findOne({ email: invite.email }).select('+password');

  if (!user) {
    if (!resolvedName || !password) {
      throw new AppError('Set your name and password to join this workspace.', 400);
    }
    user = await User.create({
      name: resolvedName,
      email: invite.email,
      password,
      avatar: '',
    });
  } else {
    if (req.user) {
      if (req.user.email.toLowerCase() !== invite.email.toLowerCase()) {
        throw new AppError('You are logged in with a different account than the invited email.', 403);
      }
    } else if (password) {
      const ok = await user.comparePassword(password);
      if (!ok) {
        throw new AppError('Invalid email or password credentials.', 401);
      }
    } else {
      throw new AppError('This email already has an account. Sign in with that account to accept the invitation.', 401);
    }
  }

  const assignedRole = invite.role || 'member';
  const alreadyMember = await Membership.findOne({ workspace: invite.workspace, user: user._id });
  if (!alreadyMember) {
    await Membership.create({
      workspace: invite.workspace,
      user: user._id,
      role: assignedRole,
    });
  }

  invite.status = 'accepted';
  await invite.save();

  const { accessToken, refreshToken } = generateTokens(user);
  setRefreshCookie(res, refreshToken);

  return sendSuccess(
    res,
    {
      user: publicUser(user),
      accessToken,
      workspace: {
        id: workspace._id.toString(),
        _id: workspace._id.toString(),
        name: workspace.name,
        role: assignedRole,
      },
    },
    'Invitation accepted successfully'
  );
};
