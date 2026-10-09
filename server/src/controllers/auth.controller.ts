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
  } = req.body;

  const resolvedName = (firstName || lastName)
    ? `${firstName || ''} ${lastName || ''}`.trim()
    : (name || '').trim();

  if (!resolvedName) {
    throw new AppError('Name is required.', 400);
  }

  // Reject member signup attempts without a valid invitation
  if (role === 'member' && !inviteToken) {
    throw new AppError(
      'Public registration is for Workspace Admins only. Members require an invitation link to join.',
      403
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
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
    name: resolvedName,
    email: normalizedEmail,
    password,
    avatar: avatar || '',
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

export const googleAuth = async (req: Request, res: Response) => {
  clearRefreshCookie(res);
  const { credential } = req.body;

  if (!credential || !googleClient || !ENV.GOOGLE_CLIENT_ID) {
    throw new AppError('Google sign-in is not available.', 400);
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: ENV.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new AppError('Invalid Google token payload', 401);
  }

  const { sub: googleId, email, picture } = payload;

  const user = await User.findOne({ $or: [{ googleId }, { email }] });
  if (!user) {
    throw new AppError(
      'This Google account is not a member of any workspace. Ask an admin for an invite, or create a new workspace with email sign-up.',
      403
    );
  }

  if (!user.googleId) {
    user.googleId = googleId;
    user.authProvider = 'google';
    if (picture) user.avatar = picture;
    await user.save();
  }

  const auth = authPayload(user);
  setRefreshCookie(res, auth.refreshToken);
  return sendSuccess(res, auth.payload, 'Google authentication successful');
};
