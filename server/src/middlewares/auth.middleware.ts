import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { AppError } from '../utils/appError.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

const readAccessToken = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }
  return undefined;
};

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = readAccessToken(req);

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to access this resource.', 401));
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET, { algorithms: ['HS256'] }) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err: any) {
    console.error(`Authentication token rejected (${err.name}): ${err.message}`);
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired. Please refresh your session.', 401));
    }
    return next(new AppError('Invalid authentication token.', 401));
  }
};

export const optionalAuthenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = readAccessToken(req);
  if (!token) {
    next();
    return;
  }
  try {
    req.user = jwt.verify(token, ENV.JWT_SECRET, { algorithms: ['HS256'] }) as AuthenticatedUser;
  } catch (err: any) {
    console.warn(`Optional authentication token ignored (${err.name}): ${err.message}`);
    // Ignore invalid optional tokens; accept flow can still use password.
  }
  next();
};
