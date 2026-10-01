import { z } from 'zod';

export const createTicketSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters').max(200),
    description: z.string().optional().default(''),
    status: z.enum(['todo', 'in_progress', 'in_review', 'done']).optional().default('todo'),
    priority: z.enum(['urgent', 'high', 'medium', 'low']).optional().default('medium'),
    type: z.enum(['bug', 'story', 'task', 'epic']).optional().default('story'),
    storyPoints: z.number().min(0).max(100).optional().default(3),
    assignee: z.string().min(1, 'Assignee is required'),
    reporter: z.string().optional(),
    fontFamily: z.string().optional(),
    alignment: z.enum(['left', 'center', 'right', 'justify']).optional(),
  }),
});

export const updateTicketSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(200).optional(),
    description: z.string().optional(),
    status: z.enum(['todo', 'in_progress', 'in_review', 'done']).optional(),
    priority: z.enum(['urgent', 'high', 'medium', 'low']).optional(),
    type: z.enum(['bug', 'story', 'task', 'epic']).optional(),
    storyPoints: z.number().min(0).max(100).optional(),
    assignee: z.string().optional(),
    reporter: z.string().optional(),
    fontFamily: z.string().optional(),
    alignment: z.enum(['left', 'center', 'right', 'justify']).optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'Ticket ID is required'),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['todo', 'in_progress', 'in_review', 'done'], {
      errorMap: () => ({ message: 'Status must be todo, in_progress, in_review, or done' }),
    }),
  }),
  params: z.object({
    id: z.string().min(1, 'Ticket ID is required'),
  }),
});

export const addCommentSchema = z.object({
  body: z.object({
    text: z.string().min(1, 'Comment text cannot be empty').max(2000),
  }),
  params: z.object({
    id: z.string().min(1, 'Ticket ID is required'),
  }),
});

export const queryTicketSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('50'),
    status: z.string().optional(),
    priority: z.string().optional(),
    type: z.string().optional(),
    assigneeId: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'storyPoints', 'title']).optional().default('createdAt'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});
