import { Response } from 'express';
import { Workspace } from '../models/Workspace.js';
import { Membership } from '../models/Membership.js';
import { AppError } from '../utils/appError.js';
import { sendSuccess } from '../utils/response.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export const getMyWorkspaces = async (req: AuthRequest, res: Response) => {
  const memberships = await Membership.find({ user: req.user!.id }).populate('workspace');
  const workspaces = memberships
    .filter((m) => m.workspace)
    .map((m) => {
      const ws = m.workspace as unknown as { _id: { toString(): string }; name: string; slug?: string; createdAt: Date };
      const id = ws._id.toString();
      return { id, _id: id, name: ws.name, slug: ws.slug, createdAt: ws.createdAt, role: m.role };
    });
  return sendSuccess(res, workspaces, 'Workspaces retrieved successfully');
};

export const getWorkspace = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const workspace = await Workspace.findById(id);
  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }
  const idStr = workspace._id.toString();
  return sendSuccess(
    res,
    { id: idStr, _id: idStr, name: workspace.name, slug: workspace.slug, createdAt: workspace.createdAt },
    'Workspace retrieved successfully'
  );
};

export const patchWorkspace = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  const workspace = await Workspace.findByIdAndUpdate(
    id,
    { name },
    { new: true, runValidators: true }
  );

  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  const idStr = workspace._id.toString();
  return sendSuccess(
    res,
    { id: idStr, _id: idStr, name: workspace.name, slug: workspace.slug, createdAt: workspace.createdAt },
    'Workspace updated successfully'
  );
};

export const getMembers = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const members = await Membership.find({ workspace: id })
    .populate('user', 'name email avatar')
    .sort({ role: 1, createdAt: 1 });

  const data = members.map((m) => {
    const u = m.user as unknown as { _id: { toString(): string }; name: string; email: string; avatar: string };
    const uid = u._id.toString();
    return {
      id: m._id.toString(),
      _id: m._id.toString(),
      role: m.role,
      createdAt: m.createdAt,
      user: { id: uid, _id: uid, name: u.name, email: u.email, avatar: u.avatar },
    };
  });

  return sendSuccess(res, data, 'Members retrieved successfully');
};

export const removeMember = async (req: AuthRequest, res: Response) => {
  const { id: workspaceId, userId } = req.params;

  if (userId === req.user!.id) {
    throw new AppError('You cannot remove yourself from the workspace.', 400);
  }

  const target = await Membership.findOne({ workspace: workspaceId, user: userId });
  if (!target) {
    throw new AppError('Member not found in this workspace.', 404);
  }

  if (target.role === 'admin') {
    const adminCount = await Membership.countDocuments({ workspace: workspaceId, role: 'admin' });
    if (adminCount <= 1) {
      throw new AppError('Cannot remove the last admin of this workspace.', 400);
    }
  }

  await target.deleteOne();
  return sendSuccess(res, null, 'Member removed successfully');
};
