import { Router } from 'express';
import { returnsController } from './returns.controller.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createReturnSchema,
  approveReturnSchema,
  rejectReturnSchema,
  receiveReturnSchema,
  refundReturnSchema,
  presignedUrlSchema,
} from './returns.schema.js';

const router = Router();

// Create return (can be submitted by customer or merchant)
router.post(
  '/',
  validate(createReturnSchema),
  returnsController.createReturn.bind(returnsController)
);

// List returns (merchant dashboard)
router.get(
  '/',
  authMiddleware,
  requireRole(['MERCHANT', 'ADMIN']),
  returnsController.listReturns.bind(returnsController)
);

// Metrics summary (merchant dashboard counters)
router.get(
  '/metrics',
  authMiddleware,
  requireRole(['MERCHANT', 'ADMIN']),
  returnsController.getMetrics.bind(returnsController)
);

// Single return detail
router.get(
  '/:id',
  returnsController.getReturn.bind(returnsController)
);

// Merchant approval
router.patch(
  '/:id/approve',
  authMiddleware,
  requireRole(['MERCHANT', 'ADMIN']),
  validate(approveReturnSchema),
  returnsController.approveReturn.bind(returnsController)
);

// Merchant rejection
router.patch(
  '/:id/reject',
  authMiddleware,
  requireRole(['MERCHANT', 'ADMIN']),
  validate(rejectReturnSchema),
  returnsController.rejectReturn.bind(returnsController)
);

// Warehouse receipt
router.patch(
  '/:id/receive',
  authMiddleware,
  requireRole(['MERCHANT', 'ADMIN']),
  validate(receiveReturnSchema),
  returnsController.markReceived.bind(returnsController)
);

// Merchant refund
router.patch(
  '/:id/refund',
  authMiddleware,
  requireRole(['MERCHANT', 'ADMIN']),
  validate(refundReturnSchema),
  returnsController.refundReturn.bind(returnsController)
);

// S3 upload URL for customer evidence photos
router.post(
  '/:id/upload-url',
  validate(presignedUrlSchema),
  returnsController.getUploadUrl.bind(returnsController)
);

export const returnRoutes = router;
