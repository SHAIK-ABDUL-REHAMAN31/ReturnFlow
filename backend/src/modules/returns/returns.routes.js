import { Router } from 'express';
import multer from 'multer';
import { returnsController } from './returns.controller.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';
import { rateLimit } from '../../middleware/rate-limit.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createReturnSchema,
  approveReturnSchema,
  rejectReturnSchema,
  receiveReturnSchema,
  refundReturnSchema,
  presignedUrlSchema,
} from './returns.schema.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed'));
    }
  },
});

const trackRateLimit = rateLimit({
  windowSeconds: 60,
  maxRequests: 60,
  prefix: 'track',
});

const router = Router();

// Create return (can be submitted by customer or merchant)
router.post(
  '/',
  validate(createReturnSchema),
  returnsController.createReturn.bind(returnsController)
);

// Public customer tracking routes (§1.4, §5 & §6)
router.get(
  '/track/:token',
  trackRateLimit,
  returnsController.getTrackStatus.bind(returnsController)
);

router.post(
  '/track/lookup',
  trackRateLimit,
  returnsController.lookupTrack.bind(returnsController)
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

// Single return detail (merchant console only)
router.get(
  '/:id',
  authMiddleware,
  requireRole(['MERCHANT', 'ADMIN']),
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

// Upload customer evidence photo directly (bypasses browser S3 CORS limitations)
router.post(
  '/:id/photos',
  upload.single('file'),
  returnsController.uploadEvidencePhoto.bind(returnsController)
);

// S3 upload URL for customer evidence photos
router.post(
  '/:id/upload-url',
  validate(presignedUrlSchema),
  returnsController.getUploadUrl.bind(returnsController)
);

// S3 presigned GET download URL for generated shipping label PDF (§4.6)
router.get(
  '/:id/label-url',
  returnsController.getLabelUrl.bind(returnsController)
);

export const returnRoutes = router;
