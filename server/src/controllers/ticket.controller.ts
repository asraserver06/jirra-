import { Response } from 'express';
import { FilterQuery, Types } from 'mongoose';
import { Ticket, ITicket } from '../models/Ticket.js';
import { Membership } from '../models/Membership.js';
import { AppError } from '../utils/appError.js';
import { sendSuccess } from '../utils/response.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

const ticketFilter = (id: string, workspaceId: Types.ObjectId): FilterQuery<ITicket> =>
  /^[0-9a-fA-F]{24}$/.test(id)
    ? { _id: id, workspaceId }
    : { key: id.toUpperCase(), workspaceId };

const workspaceUserIds = (workspaceId: Types.ObjectId) =>
  Membership.distinct('user', { workspace: workspaceId });

const scopedPopulate = (userIds: Types.ObjectId[]) => [
  { path: 'assignee', select: 'name email avatar', match: { _id: { $in: userIds } } },
  { path: 'reporter', select: 'name email avatar', match: { _id: { $in: userIds } } },
  { path: 'comments.user', select: 'name email avatar', match: { _id: { $in: userIds } } },
];

const requireWorkspaceUser = async (workspaceId: Types.ObjectId, userId: string) => {
  if (!await Membership.exists({ workspace: workspaceId, user: userId })) {
    throw new AppError('Assignee and reporter must be members of the current workspace.', 400);
  }
};

const getRouteId = (req: AuthRequest) => {
  const rawId = req.params.id;
  return Array.isArray(rawId) ? rawId[0] : rawId;
};

export const getTickets = async (req: AuthRequest, res: Response) => {
  const workspaceId = req.workspace!._id;
  const {
    page = '1',
    limit = '50',
    status,
    priority,
    type,
    assigneeId,
    search,
    sortBy = 'createdAt',
    order = 'desc',
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;
  const query: FilterQuery<ITicket> = { workspaceId };

  if (status && status !== 'all') query.status = status as ITicket['status'];
  if (priority && priority !== 'all') {
    query.priority = priority === 'high_urgent' ? { $in: ['high', 'urgent'] } : priority as ITicket['priority'];
  }
  if (type) query.type = type as ITicket['type'];
  if (assigneeId) query.assignee = assigneeId;
  if (search?.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [{ title: searchRegex }, { key: searchRegex }, { description: searchRegex }];
  }

  const [total, userIds] = await Promise.all([
    Ticket.countDocuments(query),
    workspaceUserIds(workspaceId),
  ]);
  const totalPages = Math.ceil(total / limitNum) || 1;
  const tickets = await Ticket.find(query)
    .populate(scopedPopulate(userIds))
    .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
    .skip(skip)
    .limit(limitNum);

  return sendSuccess(res, tickets.map((ticket) => ticket.toJSON()), 'Tickets retrieved successfully', 200, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages,
  });
};

export const getTicketById = async (req: AuthRequest, res: Response) => {
  const id = getRouteId(req);
  const workspaceId = req.workspace!._id;
  const userIds = await workspaceUserIds(workspaceId);
  const ticket = await Ticket.findOne(ticketFilter(id, workspaceId)).populate(scopedPopulate(userIds));

  if (!ticket) throw new AppError(`Ticket '${id}' not found`, 404);
  return sendSuccess(res, ticket, 'Ticket details retrieved');
};

export const createTicket = async (req: AuthRequest, res: Response) => {
  const workspaceId = req.workspace!._id;
  const {
    title,
    description = '',
    status = 'todo',
    priority = 'medium',
    type = 'story',
    storyPoints = 3,
    assignee,
    reporter,
    fontFamily = 'Inter, sans-serif',
    alignment = 'left',
  } = req.body;

  const assignedUserId = assignee || req.user!.id;
  const reporterUserId = reporter || req.user!.id;
  await Promise.all([
    requireWorkspaceUser(workspaceId, assignedUserId),
    requireWorkspaceUser(workspaceId, reporterUserId),
  ]);

  const latestTicket = await Ticket.findOne({ workspaceId }).sort({ createdAt: -1 });
  const latestNum = latestTicket?.key.match(/^PROJ-(\d+)$/i);
  const nextNum = latestNum ? Number(latestNum[1]) + 1 : 101;

  const newTicket = await Ticket.create({
    workspaceId,
    key: `PROJ-${nextNum}`,
    title,
    description,
    status,
    priority,
    type,
    storyPoints,
    assignee: assignedUserId,
    reporter: reporterUserId,
    fontFamily,
    alignment,
  });

  const userIds = await workspaceUserIds(workspaceId);
  const populated = await Ticket.findOne({ _id: newTicket._id, workspaceId }).populate(scopedPopulate(userIds));
  return sendSuccess(res, populated, 'Ticket created successfully', 201);
};

export const updateTicket = async (req: AuthRequest, res: Response) => {
  const id = getRouteId(req);
  const workspaceId = req.workspace!._id;
  const updates: Record<string, unknown> = {};
  const fields = ['title', 'description', 'status', 'priority', 'type', 'storyPoints', 'assignee', 'reporter', 'fontFamily', 'alignment'];
  for (const field of fields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  for (const field of ['assignee', 'reporter']) {
    if (typeof updates[field] === 'string') {
      await requireWorkspaceUser(workspaceId, updates[field] as string);
    }
  }

  const userIds = await workspaceUserIds(workspaceId);
  const updatedTicket = await Ticket.findOneAndUpdate(
    ticketFilter(id, workspaceId),
    { $set: { ...updates, updatedAt: new Date() } },
    { new: true, runValidators: true }
  ).populate(scopedPopulate(userIds));

  if (!updatedTicket) throw new AppError(`Ticket '${id}' not found`, 404);
  return sendSuccess(res, updatedTicket, 'Ticket updated successfully');
};

export const updateTicketStatus = async (req: AuthRequest, res: Response) => {
  const id = getRouteId(req);
  const workspaceId = req.workspace!._id;
  const { status } = req.body;
  const userIds = await workspaceUserIds(workspaceId);
  const updatedTicket = await Ticket.findOneAndUpdate(
    ticketFilter(id, workspaceId),
    { $set: { status, updatedAt: new Date() } },
    { new: true, runValidators: true }
  ).populate(scopedPopulate(userIds));

  if (!updatedTicket) throw new AppError(`Ticket '${id}' not found`, 404);
  return sendSuccess(res, updatedTicket, `Ticket status updated to ${status}`);
};

export const deleteTicket = async (req: AuthRequest, res: Response) => {
  const id = getRouteId(req);
  const deleted = await Ticket.findOneAndDelete(ticketFilter(id, req.workspace!._id));
  if (!deleted) throw new AppError(`Ticket '${id}' not found`, 404);
  return sendSuccess(res, { id: deleted._id, key: deleted.key }, 'Ticket deleted successfully');
};

export const addComment = async (req: AuthRequest, res: Response) => {
  const id = getRouteId(req);
  const workspaceId = req.workspace!._id;
  const { text } = req.body;
  const ticket = await Ticket.findOne(ticketFilter(id, workspaceId));
  if (!ticket) throw new AppError(`Ticket '${id}' not found`, 404);

  ticket.comments.push({ user: req.user!.id, text, createdAt: new Date() });
  await ticket.save();

  const userIds = await workspaceUserIds(workspaceId);
  const refreshed = await Ticket.findOne({ _id: ticket._id, workspaceId }).populate(scopedPopulate(userIds));
  return sendSuccess(res, refreshed, 'Comment added successfully', 201);
};
