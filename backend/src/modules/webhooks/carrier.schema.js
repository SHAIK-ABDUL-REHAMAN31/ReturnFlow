import { z } from 'zod';

export const carrierEventSchema = z.object({
  returnNumber: z.string().min(1, 'Return number is required').trim(),
  event: z.enum(['CARRIER_PICKUP', 'IN_TRANSIT', 'DELIVERED_TO_DOCK']),
  trackingNumber: z.string().min(1, 'Tracking number is required'),
  carrier: z.string().default('UPS'),
  location: z.string().default('Distribution Hub'),
  timestamp: z.string().optional(),
  note: z.string().max(500).optional(),
});
