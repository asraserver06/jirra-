import { z } from 'zod';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

export const createInvitesSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    emails: z
      .array(z.string().email('Each invite must be a valid email'))
      .min(1, 'Provide at least one email')
      .max(50, 'You can invite at most 50 people at once'),
    role: z.enum(['member', 'admin']).optional().default('member'),
  }),
});

export const workspaceIdParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const inviteIdParamSchema = z.object({
  params: z.object({
    id: objectId,
    inviteId: objectId,
  }),
});

export const memberIdParamSchema = z.object({
  params: z.object({
    id: objectId,
    userId: objectId,
  }),
});

export const patchWorkspaceSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    name: z.string().min(2, 'Workspace name must be at least 2 characters').max(100),
  }),
});

export const acceptInviteSchema = z.object({
  body: z.object({
    token: z.string().min(16, 'Invitation token is required'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    name: z.string().min(1).max(100).optional(),
    password: z.string().min(6, 'Password must be at least 6 characters long').optional(),
  }),
});

export const validateInviteSchema = z.object({
  query: z.object({
    token: z.string().min(16, 'Invitation token is required'),
  }),
});

export const previewInviteSchema = validateInviteSchema;
