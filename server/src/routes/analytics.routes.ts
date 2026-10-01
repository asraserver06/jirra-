import { Router } from 'express';
import { getSprintMetrics } from '../controllers/analytics.controller.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

const router = Router();

router.get('/sprint', asyncHandler(getSprintMetrics));

export default router;
