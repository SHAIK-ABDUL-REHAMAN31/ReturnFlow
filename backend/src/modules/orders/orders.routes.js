import { Router } from 'express';
import { ordersController } from './orders.controller.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Public / customer eligibility check
router.get('/eligibility/:orderNumber', ordersController.checkEligibility.bind(ordersController));

// Merchant orders endpoints
router.get(
  '/',
  authMiddleware,
  requireRole(['MERCHANT', 'ADMIN']),
  ordersController.listOrders.bind(ordersController)
);

router.get(
  '/:orderNumber',
  authMiddleware,
  ordersController.getOrder.bind(ordersController)
);

export const orderRoutes = router;
