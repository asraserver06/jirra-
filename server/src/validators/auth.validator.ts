import { z } from 'zod';

export const signupSchema = z
  .object({
    body: z
      .object({
        name: z.string().max(100).optional(),
        firstName: z.string().max(50).optional(),
        lastName: z.string().max(50).optional(),
        email: z.string().trim().toLowerCase().email('Please provide a valid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters long'),
        confirmPassword: z.string().optional(),
        workspaceName: z.string().max(100).optional(),
        organizationName: z.string().max(100).optional(),
        goal: z.string().max(250).optional(),
        useCase: z.string().max(250).optional(),
        role: z.string().optional(),
        inviteToken: z.string().optional(),
        avatar: z.string().url().optional(),
      })
      .refine(
        (data) => {
          if (data.name && data.name.trim().length >= 2) return true;
          if (data.firstName && data.firstName.trim().length >= 1) return true;
          return false;
        },
        { message: 'First name or full name is required', path: ['firstName'] }
      )
      .refine(
        (data) => {
          if (!data.confirmPassword) return true;
          return data.password === data.confirmPassword;
        },
        { message: 'Passwords do not match', path: ['confirmPassword'] }
      )
      .refine(
        (data) => {
          // If role is explicitly specified as member without an invite token, reject
          if (data.role && data.role === 'member' && !data.inviteToken) {
            return false;
          }
          return true;
        },
        { message: 'Public signup is for Workspace Admins only. Members require an invitation.', path: ['role'] }
      ),
  });

export const registerSchema = signupSchema;

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({}).optional(),
});
