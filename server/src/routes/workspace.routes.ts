import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireWorkspaceRole } from '../middlewares/workspace.middleware.js';
import { getWorkspace, getMembers, removeMember, getMyWorkspaces, patchWorkspace } from '../controllers/workspace.controller.js';
import { createInvites, getInvites, resendInvite, revokeInvite } from '../controllers/invite.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createInvitesSchema,
  workspaceIdParamSchema,
  inviteIdParamSchema,
  memberIdParamSchema,
  patchWorkspaceSchema,
} from '../validators/invite.validator.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { inviteLimiter } from '../middlewares/inviteRateLimit.js';

const router = Router();
const memberOrAdmin = requireWorkspaceRole(['admin', 'member']);
const adminOnly = requireWorkspaceRole(['admin']);

router.use(authenticate);

router.get('/me', asyncHandler(getMyWorkspaces));
router.get('/:id', validate(workspaceIdParamSchema), memberOrAdmin, asyncHandler(getWorkspace));
router.patch('/:id', validate(patchWorkspaceSchema), adminOnly, asyncHandler(patchWorkspace));

router.get('/:id/members', validate(workspaceIdParamSchema), memberOrAdmin, asyncHandler(getMembers));
router.delete('/:id/members/:userId', validate(memberIdParamSchema), adminOnly, asyncHandler(removeMember));

router.post('/:id/invites', inviteLimiter, validate(createInvitesSchema), adminOnly, asyncHandler(createInvites));
router.get('/:id/invites', validate(workspaceIdParamSchema), adminOnly, asyncHandler(getInvites));
router.post('/:id/invites/:inviteId/resend', validate(inviteIdParamSchema), adminOnly, asyncHandler(resendInvite));
router.delete('/:id/invites/:inviteId', validate(inviteIdParamSchema), adminOnly, asyncHandler(revokeInvite));

export default router;
