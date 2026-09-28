import { UserModel } from '../auth/auth.model.js';
import { OrderModel } from '../orders/orders.model.js';
import { ReturnModel } from '../returns/returns.model.js';
import { carrierWebhookService } from '../webhooks/carrier.service.js';
import { assertValidTransition } from '../returns/returns.state-machine.js';
import bcrypt from 'bcryptjs';

export class DemoService {
  async reseedData() {
    await UserModel.deleteMany({});
    await OrderModel.deleteMany({});
    await ReturnModel.deleteMany({});

    const passwordHash = await bcrypt.hash('Password123!', 12);

    await UserModel.create([
      { email: 'admin@returnflow.io', name: 'System Administrator', passwordHash, role: 'ADMIN' },
      { email: 'merchant@returnflow.io', name: 'Emma Watson (Merchant)', passwordHash, role: 'MERCHANT' },
      { email: 'customer@example.com', name: 'David Miller', passwordHash, role: 'CUSTOMER' },
    ]);

    const orders = [
      {
        orderNumber: 'ORD-9021',
        customerEmail: 'customer@example.com',
        customerName: 'David Miller',
        items: [
          { sku: 'AUDIO-WH1000', name: 'Wireless Noise Canceling Headphones', price: 299.99, quantity: 1, isEligibleForReturn: true },
          { sku: 'ACC-USB-C', name: 'Braided Fast Charging Cable', price: 19.99, quantity: 2, isEligibleForReturn: true },
        ],
        totalAmount: 339.97,
        status: 'DELIVERED',
        deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        orderNumber: 'ORD-9022',
        customerEmail: 'sarah.j@example.com',
        customerName: 'Sarah Jenkins',
        items: [
          { sku: 'BOOTS-TREK-42', name: 'Waterproof Alpine Hiking Boots (Size 42)', price: 185.00, quantity: 1, isEligibleForReturn: true },
        ],
        totalAmount: 185.00,
        status: 'DELIVERED',
        deliveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        orderNumber: 'ORD-9023',
        customerEmail: 'alex.chen@example.com',
        customerName: 'Alex Chen',
        items: [
          { sku: 'MOUNT-DESK', name: 'Heavy-Duty Gas Spring Monitor Arm', price: 65.00, quantity: 1, isEligibleForReturn: true },
        ],
        totalAmount: 65.00,
        status: 'DELIVERED',
        deliveredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
    ];
    await OrderModel.insertMany(orders);

    const returns = [
      {
        returnNumber: 'RET-80101',
        trackingToken: 'track_demo_token_80101',
        isActive: true,
        orderNumber: 'ORD-9021',
        customerEmail: 'customer@example.com',
        customerName: 'David Miller',
        items: [{ sku: 'AUDIO-WH1000', name: 'Wireless Noise Canceling Headphones', price: 299.99, quantity: 1, reason: 'DEFECTIVE' }],
        status: 'PENDING_REVIEW',
        reason: 'DEFECTIVE',
        customerNote: 'Audio cuts out after 10 minutes of use.',
        refundAmount: 299.99,
        timeline: [{ status: 'PENDING_REVIEW', timestamp: new Date(), note: 'Customer submitted return request', actor: 'customer@example.com' }],
      },
      {
        returnNumber: 'RET-80102',
        trackingToken: 'track_demo_token_80102',
        isActive: true,
        orderNumber: 'ORD-9022',
        customerEmail: 'sarah.j@example.com',
        customerName: 'Sarah Jenkins',
        items: [{ sku: 'BOOTS-TREK-42', name: 'Waterproof Alpine Hiking Boots (Size 42)', price: 185.00, quantity: 1, reason: 'WRONG_SIZE' }],
        status: 'LABEL_GENERATED',
        reason: 'WRONG_SIZE',
        customerNote: 'Too small',
        labelKey: 'labels/RET-80102/shipping_label.pdf',
        refundAmount: 185.00,
        timeline: [
          { status: 'PENDING_REVIEW', timestamp: new Date(Date.now() - 3600000), note: 'Submitted', actor: 'sarah.j@example.com' },
          { status: 'APPROVED', timestamp: new Date(Date.now() - 1800000), note: 'Approved', actor: 'merchant@returnflow.io' },
          { status: 'LABEL_GENERATED', timestamp: new Date(Date.now() - 900000), note: 'Label created', actor: 'LABEL_WORKER' },
        ],
      },
    ];
    await ReturnModel.insertMany(returns);

    return { success: true, message: 'Database reseeded successfully with orders and demo returns' };
  }

  async simulateCarrierScan(returnNumber, eventType = 'CARRIER_PICKUP') {
    return carrierWebhookService.processCarrierEvent({
      returnNumber,
      event: eventType,
      trackingNumber: `1Z999AA10123456784`,
      carrier: 'UPS',
      location: 'Dallas Regional Logistics Center, TX',
      note: 'Simulated carrier milestone callback',
    });
  }

  testIllegalTransition(fromStatus = 'PENDING_REVIEW', toStatus = 'REFUNDED') {
    // This will trigger the strict AppError(409) to prove the guardrail live on screen
    assertValidTransition(fromStatus, toStatus);
  }
}

export const demoService = new DemoService();
