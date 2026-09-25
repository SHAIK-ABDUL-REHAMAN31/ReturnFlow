import { z } from 'zod';

export const RETURN_REASONS = [
  'DEFECTIVE',
  'WRONG_ITEM',
  'NOT_AS_DESCRIBED',
  'WRONG_SIZE',
  'CHANGED_MIND',
];

export const returnItemSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Item name is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0, 'Price must be non-negative'),
  reason: z.enum(RETURN_REASONS).optional(),
});

export const createReturnSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required').trim(),
  customerEmail: z.string().email('Valid customer email is required').toLowerCase().trim(),
  customerName: z.string().min(1, 'Customer name is required').trim(),
  reason: z.enum(RETURN_REASONS),
  items: z.array(returnItemSchema).min(1, 'At least one item must be returned'),
  customerNote: z.string().max(1000).optional(),
});
