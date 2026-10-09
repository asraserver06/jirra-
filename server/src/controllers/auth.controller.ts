import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User, IUser } from '../models/User.js';
import { ENV } from '../config/env.js';
import { AppError } from '../utils/appError.js';
import { sendSuccess } from '../utils/response.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { Workspace } from '../models/Workspace.js';
import { Membership } from '../models/Membership.js';
import { Invitation } from '../models/Invitation.js';
import { generateTokens, setRefreshCookie, clearRefreshCookie, publicUser } from '../utils/authTokens.js';
import { sendWelcomeEmail } from '../services/email.services.js';
import { hashInviteToken } from '../utils/inviteToken.js';
import { loadPendingInviteByToken } from '../services/invite.service.js';

const googleClient = ENV.GOOGLE_CLIENT_ID ? new OAuth2Client(ENV.GOOGLE_CLIENT_ID) : null;

const authPayload = (user: IUser, extra: Record<string, unknown> = {}) => {
  const { accessToken, refreshToken } = generateTokens(user);
  return {
    refreshToken,
    payload: {
      user: publicUser(user),
      accessToken,
      ...extra,
    },
  };
};

const isDuplicateKeyError = (error: unknown): error is { code: number } =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;

const findOrLinkGoogleUser = async ({
  googleId,
  email,
  name,
  picture,
}: {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}) => {
  let user = await User.findOne({ $or: [{ googleId }, { email }] });
  if (!user) return null;

  if (user.googleId && user.googleId !== googleId) {
    throw new AppError('This email address is linked to another Google account.', 409);
  }

  if (!user.googleId) {
    user.googleId = googleId;
    user.authProvider = 'google';
    if (picture) user.avatar = picture;
    try {
      await user.save();
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      const linkedUser = await User.findOne({ $or: [{ googleId }, { email }] });
      if (!linkedUser || (linkedUser.googleId && linkedUser.googleId !== googleId)) {
        throw new AppError('This email address is linked to another Google account.', 409);
      }
      user = linkedUser;
    }
  } else if (picture && !user.avatar) {
    user.avatar = picture;
    await user.save();
  }

  return user;
};

/**
 * Public sign-up: creates an Admin and their workspace.
 * Members cannot sign up publicly without a valid invite token.
 */
export const signup = async (req: Request, res: Response) => {
  clearRefreshCookie(res);
  const {
    name,
    firstName,
    lastName,
    email,
    password,
    workspaceName,
    organizationName,
    goal,
    useCase,
    role,
    inviteToken,
    avatar,
    googleSignupTicket,
  } = req.body;

  const resolvedName = (firstName || lastName)
    ? `${firstName || ''} ${lastName || ''}`.trim()
    : (name || '').trim();

  if (!resolvedName && !googleSignupTicket) {
    throw new AppError('Name is required.', 400);
  }

  // Reject member signup attempts without a valid invitation
  if (role === 'member' && !inviteToken) {
    throw new AppError(
      'Public registration is for Workspace Admins only. Members require an invitation link to join.',
      403
    );
  }
  if (googleSignupTicket && inviteToken) {
    throw new AppError('Google account setup must create an admin workspace, not accept an invitation.', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  let verifiedGoogleIdentity: { googleId: string; name: string } | null = null;
  if (googleSignupTicket) {
    let claims: jwt.JwtPayload;
    try {
      claims = jwt.verify(googleSignupTicket, ENV.JWT_SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload;
    } catch {
      throw new AppError('Google signup session is invalid or expired. Please sign in with Google again.', 401);
    }
    if (
      claims.purpose !== 'google_signup' ||
      typeof claims.email !== 'string' ||
      typeof claims.name !== 'string' ||
      typeof claims.googleId !== 'string'
    ) {
      throw new AppError('Google signup session is invalid. Please sign in with Google again.', 401);
    }
    if (claims.email !== normalizedEmail) {
      throw new AppError('The signup email does not match the verified Google account.', 403);
    }
    verifiedGoogleIdentity = { googleId: claims.googleId, name: claims.name };
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError('An account with this email address already exists.', 409);
  }

  // If registering via inviteToken
  if (inviteToken) {
    const tokenHash = hashInviteToken(inviteToken);
    const invite = await Invitation.findOne({ tokenHash });
    if (!invite || invite.status !== 'pending' || invite.expiresAt < new Date()) {
      throw new AppError('The invitation link is invalid or has expired.', 400);
    }
    if (invite.email.toLowerCase() !== normalizedEmail) {
      throw new AppError(`This invitation was issued for ${invite.email}. Please use that email.`, 403);
    }

    const user = await User.create({
      name: resolvedName,
      email: normalizedEmail,
      password,
      avatar: avatar || '',
    });

    await Membership.create({
      workspace: invite.workspace,
      user: user._id,
      role: invite.role || 'member',
    });

    invite.status = 'accepted';
    await invite.save();

    const workspace = await Workspace.findById(invite.workspace);

    const auth = authPayload(user, {
      workspace: {
        id: invite.workspace.toString(),
        _id: invite.workspace.toString(),
        name: workspace?.name || 'Workspace',
        role: invite.role || 'member',
      },
    });

    setRefreshCookie(res, auth.refreshToken);
    return sendSuccess(res, auth.payload, 'Account created and joined workspace successfully', 201);
  }

  // Admin Sign-Up flow
  const user = await User.create({
    name: resolvedName || verifiedGoogleIdentity!.name,
    email: normalizedEmail,
    password,
    avatar: avatar || '',
    ...(verifiedGoogleIdentity
      ? { googleId: verifiedGoogleIdentity.googleId, authProvider: 'google' as const }
      : {}),
  });

  const finalWorkspaceName = (workspaceName || organizationName || `${resolvedName}'s Workspace`).trim();
  const finalGoal = (goal || useCase || '').trim();

  const workspace = await Workspace.create({
    name: finalWorkspaceName,
    goal: finalGoal,
  });

  await Membership.create({
    workspace: workspace._id,
    user: user._id,
    role: 'admin',
  });

  // Send welcome email to the Admin (awaited to ensure delivery before completing lifecycle)
  try {
    await sendWelcomeEmail(user.email, user.name, workspace.name);
  } catch (err) {
    console.error('Failed to dispatch welcome email:', err);
  }

  const auth = authPayload(user, {
    workspace: {
      id: workspace._id.toString(),
      _id: workspace._id.toString(),
      name: workspace.name,
      goal: workspace.goal,
      role: 'admin',
    },
  });

  setRefreshCookie(res, auth.refreshToken);

  return sendSuccess(res, auth.payload, 'Workspace and admin account created successfully', 201);
};

export const register = signup;

export const login = async (req: Request, res: Response) => {
  clearRefreshCookie(res);
  const { email, password } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    console.warn(`Login failed: no account found for ${normalizedEmail || '(empty email)'}.`);
    throw new AppError('No account exists for this email address.', 401);
  }

  let isPasswordCorrect: boolean;
  try {
    isPasswordCorrect = await user.comparePassword(password);
  } catch (error) {
    const details = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error(`Password comparison failed for ${normalizedEmail}: ${details}`);
    throw new AppError('Unable to verify these credentials. Please try again.', 500);
  }
  if (!isPasswordCorrect) {
    console.warn(`Login failed: incorrect password for ${normalizedEmail}.`);
    throw new AppError('The password is incorrect.', 401);
  }

  try {
    const auth = authPayload(user);
    setRefreshCookie(res, auth.refreshToken);
    return sendSuccess(res, auth.payload, 'Login successful');
  } catch (error) {
    const details = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error(`Login token creation failed for ${normalizedEmail}: ${details}`);
    throw new AppError('Unable to create a login session. Please try again.', 500);
  }
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    clearRefreshCookie(res);
    throw new AppError('No refresh token provided', 401);
  }

  let decoded: { id: string };
  try {
    decoded = jwt.verify(token, ENV.JWT_REFRESH_SECRET, { algorithms: ['HS256'] }) as { id: string };
  } catch (err: any) {
    console.error(`Refresh token rejected (${err.name}): ${err.message}`);
    clearRefreshCookie(res);
    throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    clearRefreshCookie(res);
    throw new AppError('User belonging to this token no longer exists', 401);
  }

  const { accessToken } = generateTokens(user);
  return sendSuccess(res, { accessToken }, 'Access token refreshed successfully');
};

export const getMe = async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return sendSuccess(res, user, 'User profile retrieved');
};

export const googleAuthStatus = async (_req: Request, res: Response) =>
  sendSuccess(res, { enabled: Boolean(googleClient && ENV.GOOGLE_CLIENT_ID) }, 'Google sign-in availability');

export const googleAuth = async (req: Request, res: Response) => {
  clearRefreshCookie(res);
  const { credential, inviteToken } = req.body;

  if (!credential || !googleClient || !ENV.GOOGLE_CLIENT_ID) {
    throw new AppError('Google sign-in is not available.', 400);
  }

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: ENV.GOOGLE_CLIENT_ID,
    });
  } catch (error) {
    const details = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.warn(`Google credential verification failed: ${details}`);
    throw new AppError('Google sign-in could not verify your account. Please try again.', 401);
  }

  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub) {
    throw new AppError('Invalid Google token payload', 401);
  }
  if (!payload.email_verified) {
    throw new AppError('Google must verify your email address before you can sign in.', 403);
  }

  const googleId = payload.sub;
  const email = payload.email.trim().toLowerCase();
  const name = payload.name?.trim() || email.split('@')[0];
  const picture = payload.picture;

  let invite: Awaited<ReturnType<typeof loadPendingInviteByToken>> | null = null;
  if (typeof inviteToken === 'string' && inviteToken) {
    invite = await loadPendingInviteByToken(inviteToken);
    if (invite.email.toLowerCase() !== email) {
      throw new AppError(`This invitation was issued for ${invite.email}. Sign in with that Google email address.`, 403);
    }
  }

  const user = await findOrLinkGoogleUser({ googleId, email, name, picture });
  if (!user) {
    const pendingInvite = invite || await Invitation.findOne({
      email,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });
    if (pendingInvite) {
      return sendSuccess(
        res,
        {
          status: 'needs_invite',
          email,
          name,
          ...(inviteToken ? { inviteToken } : {}),
        },
        'This email has a pending workspace invitation. Continue from the invitation link.'
      );
    }

    const signupTicket = jwt.sign(
      { purpose: 'google_signup', email, name, googleId },
      ENV.JWT_SECRET,
      { expiresIn: '15m', algorithm: 'HS256' }
    );
    return sendSuccess(
      res,
      { status: 'needs_signup', signupTicket, email, name },
      'Create an account to set up your workspace.'
    );
  }

  if (invite) {
    let membership = await Membership.findOne({ workspace: invite.workspace, user: user._id });
    if (!membership) {
      try {
        membership = await Membership.create({
          workspace: invite.workspace,
          user: user._id,
          role: invite.role || 'member',
        });
      } catch (error) {
        if (!isDuplicateKeyError(error)) throw error;
        membership = await Membership.findOne({ workspace: invite.workspace, user: user._id });
        if (!membership) throw error;
      }
    }

    const acceptedInvite = await Invitation.findOneAndUpdate(
      { _id: invite._id, status: 'pending' },
      { status: 'accepted' },
      { new: true }
    );
    if (!acceptedInvite) {
      const currentInvite = await Invitation.findById(invite._id);
      if (currentInvite?.status !== 'accepted') {
        throw new AppError('This invitation is no longer available.', 400);
      }
    }

    const inviteWorkspace = invite.workspace as unknown as { _id: { toString(): string }; name: string };
    const auth = authPayload(user, {
      workspace: {
        id: inviteWorkspace._id.toString(),
        _id: inviteWorkspace._id.toString(),
        name: inviteWorkspace.name,
        role: invite.role || 'member',
      },
    });
    setRefreshCookie(res, auth.refreshToken);
    return sendSuccess(res, auth.payload, 'Google account joined the invited workspace successfully');
  }

  const auth = authPayload(user);
  setRefreshCookie(res, auth.refreshToken);
  return sendSuccess(res, auth.payload, 'Google authentication successful');
};
