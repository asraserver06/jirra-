import { Router } from 'express';
import { optionalAuthenticate } from '../middlewares/auth.middleware.js';
import { acceptInvite, previewInvite, validateInvite } from '../controllers/invite.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { acceptInviteSchema, previewInviteSchema, validateInviteSchema } from '../validators/invite.validator.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

const router = Router();

router.get('/validate', validate(validateInviteSchema), asyncHandler(validateInvite));
router.get('/preview', validate(previewInviteSchema), asyncHandler(previewInvite));
router.post('/accept', optionalAuthenticate, validate(acceptInviteSchema), asyncHandler(acceptInvite));

export default router;
