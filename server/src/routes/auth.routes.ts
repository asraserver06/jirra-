import { Router } from 'express';
import {
  register,
  login,
  refresh,
  getMe,
  getAllUsers,
} from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../validators/auth.validator.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(register));
router.post('/login', validate(loginSchema), asyncHandler(login));
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(refresh));
router.get('/me', authenticate, asyncHandler(getMe));
router.get('/users', asyncHandler(getAllUsers));

export default router;
