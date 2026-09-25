import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.schema.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { rateLimit } from '../../middleware/rate-limit.middleware.js';

const router = Router();

// Tighter rate-limiting on authentication endpoints to prevent credential stuffing (§5.3)
const authLimiter = rateLimit({
  windowSeconds: 60,
  maxRequests: 15,
  prefix: 'auth',
});

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register.bind(authController)
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login.bind(authController)
);

router.post(
  '/refresh',
  authLimiter,
  validate(refreshTokenSchema),
  authController.refresh.bind(authController)
);

router.post(
  '/logout',
  authMiddleware,
  authController.logout.bind(authController)
);

router.get(
  '/me',
  authMiddleware,
  authController.me.bind(authController)
);

export const authRoutes = router;
