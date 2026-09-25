import { Router } from 'express';
import { analyticsController } from './analytics.controller.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// GET /api/returns/analytics (protected for merchants and admins)
router.get(
  '/',
  authMiddleware,
  requireRole(['MERCHANT', 'ADMIN']),
  analyticsController.getAnalytics.bind(analyticsController)
);

export const analyticsRoutes = router;
