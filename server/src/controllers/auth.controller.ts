import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { ENV } from '../config/env.js';
import { AppError } from '../utils/appError.js';
import { sendSuccess } from '../utils/response.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

const generateTokens = (user: IUser) => {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const accessToken = jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN as any,
  });

  const refreshToken = jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
    expiresIn: ENV.JWT_REFRESH_EXPIRES_IN as any,
  });

  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password, role, avatar } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('An account with this email address already exists.', 409);
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'developer',
    avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
  });

  const { accessToken, refreshToken } = generateTokens(user);

  // Set HTTP-only Cookie for refresh token
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return sendSuccess(
    res,
    {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    },
    'Account registered successfully',
    201
  );
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Check user and explicitly select password field
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password credentials.', 401);
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new AppError('Invalid email or password credentials.', 401);
  }

  const { accessToken, refreshToken } = generateTokens(user);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return sendSuccess(
    res,
    {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    },
    'Login successful'
  );
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  if (!token) {
    throw new AppError('No refresh token provided', 401);
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_REFRESH_SECRET) as any;
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new AppError('User belonging to this token no longer exists', 401);
    }

    const { accessToken } = generateTokens(user);

    return sendSuccess(res, { accessToken }, 'Access token refreshed successfully');
  } catch {
    throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return sendSuccess(res, user, 'User profile retrieved');
};

export const getAllUsers = async (req: Request, res: Response) => {
  const users = await User.find().select('name email role avatar').sort('name');
  return sendSuccess(res, users, 'Users list retrieved');
};
