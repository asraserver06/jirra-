import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireWorkspaceContext } from '../middlewares/workspace.middleware.js';
import { getSprintMetrics } from '../controllers/analytics.controller.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

const router = Router();

router.use(authenticate, requireWorkspaceContext());
router.get('/sprint', asyncHandler(getSprintMetrics));

export default router;
