import { Invitation } from '../models/Invitation.js';
import { AppError } from '../utils/appError.js';
import { hashInviteToken } from '../utils/inviteToken.js';

export const loadPendingInviteByToken = async (rawToken: string) => {
  if (!rawToken) {
    throw new AppError('Invitation token is required.', 400);
  }
  const tokenHash = hashInviteToken(rawToken);
  const invite = await Invitation.findOne({ tokenHash }).populate('workspace').populate('invitedBy', 'name email');
  if (!invite) {
    throw new AppError('This invitation link is invalid.', 404);
  }
  if (invite.status === 'revoked') {
    throw new AppError('This invitation has been revoked.', 400);
  }
  if (invite.status === 'accepted') {
    throw new AppError('This invitation has already been used.', 400);
  }
  if (invite.status === 'expired' || invite.expiresAt < new Date()) {
    if (invite.status === 'pending') {
      invite.status = 'expired';
      await invite.save();
    }
    throw new AppError('This invitation has expired.', 400);
  }
  if (invite.status !== 'pending') {
    throw new AppError('This invitation is no longer available.', 400);
  }
  if (!invite.workspace) {
    throw new AppError('The workspace for this invitation no longer exists.', 404);
  }
  return invite;
};
