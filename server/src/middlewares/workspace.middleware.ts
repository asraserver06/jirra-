import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware.js';
import { Membership, WorkspaceRole } from '../models/Membership.js';
import { Workspace } from '../models/Workspace.js';
import { AppError } from '../utils/appError.js';
import mongoose from 'mongoose';

export const requireWorkspaceContext = (allowedRoles?: WorkspaceRole[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required.', 401));
      }

      const isWorkspaceRoute = req.baseUrl.endsWith('/workspaces');
      const workspaceId = isWorkspaceRoute
        ? req.params.id || req.params.workspaceId
        : req.get('x-workspace-id') || req.params.workspaceId;
      if (!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId as string)) {
        return next(new AppError('Invalid or missing workspace ID.', 400));
      }

      const membership = await Membership.findOne({
        workspace: workspaceId,
        user: req.user.id,
      });

      if (!membership) {
        return next(new AppError('You are not a member of this workspace.', 403));
      }

      if (allowedRoles && !allowedRoles.includes(membership.role)) {
        return next(new AppError('Access forbidden: Insufficient workspace permissions.', 403));
      }

      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        return next(new AppError('Workspace not found.', 404));
      }

      req.workspace = workspace;
      req.membership = membership;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireWorkspaceRole = (allowedRoles: WorkspaceRole[]) =>
  requireWorkspaceContext(allowedRoles);
