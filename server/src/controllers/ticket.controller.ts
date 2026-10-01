import { Request, Response } from 'express';
import { Ticket } from '../models/Ticket.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { sendSuccess } from '../utils/response.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export const getTickets = async (req: Request, res: Response) => {
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

  // Build filter query
  const query: any = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  if (priority && priority !== 'all') {
    if (priority === 'high_urgent') {
      query.priority = { $in: ['high', 'urgent'] };
    } else {
      query.priority = priority;
    }
  }

  if (type) {
    query.type = type;
  }

  if (assigneeId) {
    query.assignee = assigneeId;
  }

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { title: searchRegex },
      { key: searchRegex },
      { description: searchRegex },
    ];
  }

  // Count total matching documents
  const total = await Ticket.countDocuments(query);
  const totalPages = Math.ceil(total / limitNum) || 1;

  // Fetch paginated tickets with populated user references
  const sortDirection = order === 'asc' ? 1 : -1;
  const tickets = await Ticket.find(query)
    .populate('assignee', 'name email avatar role')
    .populate('reporter', 'name email avatar role')
    .populate('comments.user', 'name email avatar role')
    .sort({ [sortBy]: sortDirection })
    .skip(skip)
    .limit(limitNum)
    .lean();

  return sendSuccess(
    res,
    tickets,
    'Tickets retrieved successfully',
    200,
    {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    }
  );
};

export const getTicketById = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  // Search by either MongoDB _id or key (e.g. PROJ-101)
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  const query = isObjectId ? { _id: id } : { key: id.toUpperCase() };

  const ticket = await Ticket.findOne(query)
    .populate('assignee', 'name email avatar role')
    .populate('reporter', 'name email avatar role')
    .populate('comments.user', 'name email avatar role');

  if (!ticket) {
    throw new AppError(`Ticket '${id}' not found`, 404);
  }

  return sendSuccess(res, ticket, 'Ticket details retrieved');
};

export const createTicket = async (req: AuthRequest, res: Response) => {
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

  // Generate sequential key: find highest PROJ number
  const latestTicket = await Ticket.findOne().sort({ createdAt: -1 });
  let nextNum = 101;
  if (latestTicket && latestTicket.key.startsWith('PROJ-')) {
    const numPart = parseInt(latestTicket.key.replace('PROJ-', ''), 10);
    if (!isNaN(numPart)) {
      nextNum = numPart + 1;
    }
  }

  const defaultUser = await User.findOne();
  const assignedUserId = assignee || (defaultUser ? defaultUser._id : null);
  const reporterUserId = reporter || req.user?.id || (defaultUser ? defaultUser._id : null);

  const newTicket = await Ticket.create({
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

  const populated = await Ticket.findById(newTicket._id)
    .populate('assignee', 'name email avatar role')
    .populate('reporter', 'name email avatar role');

  return sendSuccess(res, populated, 'Ticket created successfully', 201);
};

export const updateTicket = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  const filter = isObjectId ? { _id: id } : { key: id };

  const updatedTicket = await Ticket.findOneAndUpdate(
    filter,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  )
    .populate('assignee', 'name email avatar role')
    .populate('reporter', 'name email avatar role')
    .populate('comments.user', 'name email avatar role');

  if (!updatedTicket) {
    throw new AppError(`Ticket '${id}' not found`, 404);
  }

  return sendSuccess(res, updatedTicket, 'Ticket updated successfully');
};

export const updateTicketStatus = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const { status } = req.body;

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  const filter = isObjectId ? { _id: id } : { key: id };

  const updatedTicket = await Ticket.findOneAndUpdate(
    filter,
    { status, updatedAt: new Date() },
    { new: true }
  )
    .populate('assignee', 'name email avatar role')
    .populate('reporter', 'name email avatar role');

  if (!updatedTicket) {
    throw new AppError(`Ticket '${id}' not found`, 404);
  }

  return sendSuccess(res, updatedTicket, `Ticket status updated to ${status}`);
};

export const deleteTicket = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  const filter = isObjectId ? { _id: id } : { key: id };

  const deleted = await Ticket.findOneAndDelete(filter);
  if (!deleted) {
    throw new AppError(`Ticket '${id}' not found`, 404);
  }

  return sendSuccess(res, { id: deleted._id, key: deleted.key }, 'Ticket deleted successfully');
};

export const addComment = async (req: AuthRequest, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const { text } = req.body;

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  const filter = isObjectId ? { _id: id } : { key: id };

  const ticket = await Ticket.findOne(filter);
  if (!ticket) {
    throw new AppError(`Ticket '${id}' not found`, 404);
  }

  const defaultUser = await User.findOne();
  const commentUser = req.user?.id || (defaultUser ? defaultUser._id : null);

  ticket.comments.push({
    user: commentUser,
    text,
    createdAt: new Date(),
  });

  await ticket.save();

  const refreshed = await Ticket.findById(ticket._id)
    .populate('assignee', 'name email avatar role')
    .populate('reporter', 'name email avatar role')
    .populate('comments.user', 'name email avatar role');

  return sendSuccess(res, refreshed, 'Comment added successfully', 201);
};
