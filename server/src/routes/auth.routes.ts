import { Router } from 'express';
import { signup, login, refresh, getMe, googleAuth, googleAuthStatus } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { signupSchema, loginSchema, googleAuthSchema, refreshTokenSchema } from '../validators/auth.validator.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

const router = Router();

router.post('/signup', validate(signupSchema), asyncHandler(signup));
router.post('/register', validate(signupSchema), asyncHandler(signup));
router.post('/login', validate(loginSchema), asyncHandler(login));
router.get('/google/status', asyncHandler(googleAuthStatus));
router.post('/google', validate(googleAuthSchema), asyncHandler(googleAuth));
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(refresh));
router.get('/me', authenticate, asyncHandler(getMe));

export default router;
