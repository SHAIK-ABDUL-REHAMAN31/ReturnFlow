import { Router } from 'express';
import { carrierWebhookController } from './carrier.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { carrierEventSchema } from './carrier.schema.js';
import { rateLimit } from '../../middleware/rate-limit.middleware.js';

const router = Router();

// Public webhook endpoint for simulated or live carrier callbacks (§2 Phase 4)
const webhookLimiter = rateLimit({
  windowSeconds: 60,
  maxRequests: 60,
  prefix: 'carrier_webhook',
});

router.post(
  '/carrier',
  webhookLimiter,
  validate(carrierEventSchema),
  carrierWebhookController.handleCarrierCallback.bind(carrierWebhookController)
);

export const webhookRoutes = router;
