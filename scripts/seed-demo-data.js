import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/returnflow';

// Models definition for standalone seeding
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  refreshToken: { type: String, default: null },
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerEmail: { type: String, required: true },
  customerName: { type: String, required: true },
  items: [{ sku: String, name: String, price: Number, quantity: Number, isEligibleForReturn: Boolean }],
  totalAmount: Number,
  status: String,
  deliveredAt: Date,
}, { timestamps: true });

const ReturnSchema = new mongoose.Schema({
  returnNumber: { type: String, required: true, unique: true },
  orderNumber: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerName: { type: String, required: true },
  items: [{ sku: String, name: String, price: Number, quantity: Number, reason: String }],
  status: { type: String, required: true },
  reason: { type: String, required: true },
  customerNote: String,
  merchantNote: String,
  rejectionReason: String,
  evidencePhotos: [String],
  labelKey: String,
  refundAmount: Number,
  idempotencyKey: String,
  timeline: [{ status: String, timestamp: Date, note: String, actor: String }],
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Order = mongoose.model('Order', OrderSchema);
const Return = mongoose.model('Return', ReturnSchema);

async function seed() {
  console.log(`[Seed] Connecting to MongoDB: ${MONGO_URI}`);
  await mongoose.connect(MONGO_URI);

  console.log('[Seed] Clearing existing data...');
  await User.deleteMany({});
  await Order.deleteMany({});
  await Return.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123!', 12);

  console.log('[Seed] Creating demo users...');
  await User.create([
    {
      email: 'admin@returnflow.io',
      name: 'System Administrator',
      passwordHash,
      role: 'ADMIN',
    },
    {
      email: 'merchant@returnflow.io',
      name: 'Emma Watson (Merchant)',
      passwordHash,
      role: 'MERCHANT',
    },
    {
      email: 'customer@example.com',
      name: 'David Miller',
      passwordHash,
      role: 'CUSTOMER',
    },
  ]);

  console.log('[Seed] Creating demo orders...');
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
        { sku: 'MONITOR-4K-27', name: 'Ultra-HD 27" IPS Display', price: 420.00, quantity: 1, isEligibleForReturn: true },
        { sku: 'MOUNT-DESK', name: 'Heavy-Duty Gas Spring Monitor Arm', price: 65.00, quantity: 1, isEligibleForReturn: true },
      ],
      totalAmount: 485.00,
      status: 'DELIVERED',
      deliveredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
    {
      orderNumber: 'ORD-9024',
      customerEmail: 'maria.g@example.com',
      customerName: 'Maria Garcia',
      items: [
        { sku: 'JACKET-DOWN-L', name: 'Ultralight Goose Down Puffer (L)', price: 159.00, quantity: 1, isEligibleForReturn: true },
      ],
      totalAmount: 159.00,
      status: 'DELIVERED',
      deliveredAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    },
    {
      orderNumber: 'ORD-9025',
      customerEmail: 'robert.t@example.com',
      customerName: 'Robert Taylor',
      items: [
        { sku: 'KEYBOARD-MECH-RGB', name: 'Custom Mechanical Keyboard', price: 140.00, quantity: 1, isEligibleForReturn: true },
      ],
      totalAmount: 140.00,
      status: 'DELIVERED',
      deliveredAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
    {
      orderNumber: 'ORD-9026',
      customerEmail: 'lisa.w@example.com',
      customerName: 'Lisa Wong',
      items: [
        { sku: 'BAG-LEATHER-WORK', name: 'Handcrafted Vintage Messenger Bag', price: 210.00, quantity: 1, isEligibleForReturn: true },
      ],
      totalAmount: 210.00,
      status: 'DELIVERED',
      deliveredAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
  ];
  await Order.insertMany(orders);

  console.log('[Seed] Creating demo returns covering EVERY state in the lifecycle...');
  const returns = [
    // 1. PENDING_REVIEW
    {
      returnNumber: 'RET-80101',
      orderNumber: 'ORD-9021',
      customerEmail: 'customer@example.com',
      customerName: 'David Miller',
      items: [
        { sku: 'AUDIO-WH1000', name: 'Wireless Noise Canceling Headphones', price: 299.99, quantity: 1, reason: 'DEFECTIVE' },
      ],
      status: 'PENDING_REVIEW',
      reason: 'DEFECTIVE',
      customerNote: 'Right ear cup audio cuts out intermittently after 10 minutes of use.',
      evidencePhotos: ['returns/RET-80101/evidence_headphones.jpg'],
      refundAmount: 299.99,
      timeline: [
        {
          status: 'PENDING_REVIEW',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          note: 'Return requested by customer via self-service portal',
          actor: 'customer@example.com',
        },
      ],
    },
    // 2. APPROVED
    {
      returnNumber: 'RET-80102',
      orderNumber: 'ORD-9022',
      customerEmail: 'sarah.j@example.com',
      customerName: 'Sarah Jenkins',
      items: [
        { sku: 'BOOTS-TREK-42', name: 'Waterproof Alpine Hiking Boots (Size 42)', price: 185.00, quantity: 1, reason: 'WRONG_SIZE' },
      ],
      status: 'APPROVED',
      reason: 'WRONG_SIZE',
      customerNote: 'Size 42 is too narrow in the toe box, need to return for refund.',
      merchantNote: 'Approved. Fast-tracked for automated label generation.',
      refundAmount: 185.00,
      timeline: [
        { status: 'PENDING_REVIEW', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), note: 'Submitted by customer', actor: 'sarah.j@example.com' },
        { status: 'APPROVED', timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000), note: 'Approved by merchant', actor: 'merchant@returnflow.io' },
      ],
    },
    // 3. LABEL_GENERATED
    {
      returnNumber: 'RET-80103',
      orderNumber: 'ORD-9023',
      customerEmail: 'alex.chen@example.com',
      customerName: 'Alex Chen',
      items: [
        { sku: 'MOUNT-DESK', name: 'Heavy-Duty Gas Spring Monitor Arm', price: 65.00, quantity: 1, reason: 'NOT_AS_DESCRIBED' },
      ],
      status: 'LABEL_GENERATED',
      reason: 'NOT_AS_DESCRIBED',
      customerNote: 'Desk clamp does not fit desks thicker than 2 inches.',
      labelKey: 'labels/RET-80103/shipping_label.pdf',
      refundAmount: 65.00,
      timeline: [
        { status: 'PENDING_REVIEW', timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), note: 'Customer initiated return', actor: 'alex.chen@example.com' },
        { status: 'APPROVED', timestamp: new Date(Date.now() - 42 * 60 * 60 * 1000), note: 'Approved by merchant', actor: 'merchant@returnflow.io' },
        { status: 'LABEL_GENERATED', timestamp: new Date(Date.now() - 41 * 60 * 60 * 1000), note: 'Prepaid UPS return shipping label generated and emailed', actor: 'LABEL_WORKER' },
      ],
    },
    // 4. IN_TRANSIT
    {
      returnNumber: 'RET-80104',
      orderNumber: 'ORD-9024',
      customerEmail: 'maria.g@example.com',
      customerName: 'Maria Garcia',
      items: [
        { sku: 'JACKET-DOWN-L', name: 'Ultralight Goose Down Puffer (L)', price: 159.00, quantity: 1, reason: 'CHANGED_MIND' },
      ],
      status: 'IN_TRANSIT',
      reason: 'CHANGED_MIND',
      customerNote: 'Color did not match expectations.',
      labelKey: 'labels/RET-80104/shipping_label.pdf',
      refundAmount: 159.00,
      timeline: [
        { status: 'PENDING_REVIEW', timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000), note: 'Customer request', actor: 'maria.g@example.com' },
        { status: 'APPROVED', timestamp: new Date(Date.now() - 65 * 60 * 60 * 1000), note: 'Merchant approval', actor: 'merchant@returnflow.io' },
        { status: 'LABEL_GENERATED', timestamp: new Date(Date.now() - 64 * 60 * 60 * 1000), note: 'Label created', actor: 'LABEL_WORKER' },
        { status: 'IN_TRANSIT', timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000), note: 'Package scanned at carrier origin facility (Dallas, TX)', actor: 'CARRIER_WEBHOOK' },
      ],
    },
    // 5. RECEIVED
    {
      returnNumber: 'RET-80105',
      orderNumber: 'ORD-9025',
      customerEmail: 'robert.t@example.com',
      customerName: 'Robert Taylor',
      items: [
        { sku: 'KEYBOARD-MECH-RGB', name: 'Custom Mechanical Keyboard', price: 140.00, quantity: 1, reason: 'DEFECTIVE' },
      ],
      status: 'RECEIVED',
      reason: 'DEFECTIVE',
      customerNote: 'Spacebar switch does not register clicks.',
      labelKey: 'labels/RET-80105/shipping_label.pdf',
      refundAmount: 140.00,
      timeline: [
        { status: 'PENDING_REVIEW', timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000), note: 'Initiated', actor: 'robert.t@example.com' },
        { status: 'APPROVED', timestamp: new Date(Date.now() - 90 * 60 * 60 * 1000), note: 'Approved', actor: 'merchant@returnflow.io' },
        { status: 'LABEL_GENERATED', timestamp: new Date(Date.now() - 89 * 60 * 60 * 1000), note: 'Label created', actor: 'LABEL_WORKER' },
        { status: 'IN_TRANSIT', timestamp: new Date(Date.now() - 60 * 60 * 60 * 1000), note: 'In transit with FedEx', actor: 'CARRIER_WEBHOOK' },
        { status: 'RECEIVED', timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000), note: 'Received at Dock 4, condition verified by warehouse staff', actor: 'warehouse@returnflow.io' },
      ],
    },
    // 6. REFUNDED
    {
      returnNumber: 'RET-80106',
      orderNumber: 'ORD-9026',
      customerEmail: 'lisa.w@example.com',
      customerName: 'Lisa Wong',
      items: [
        { sku: 'BAG-LEATHER-WORK', name: 'Handcrafted Vintage Messenger Bag', price: 210.00, quantity: 1, reason: 'WRONG_ITEM' },
      ],
      status: 'REFUNDED',
      reason: 'WRONG_ITEM',
      customerNote: 'Received brown messenger bag instead of the black one ordered.',
      labelKey: 'labels/RET-80106/shipping_label.pdf',
      refundAmount: 210.00,
      idempotencyKey: 'refund:RET-80106:seed',
      timeline: [
        { status: 'PENDING_REVIEW', timestamp: new Date(Date.now() - 120 * 60 * 60 * 1000), note: 'Initiated', actor: 'lisa.w@example.com' },
        { status: 'APPROVED', timestamp: new Date(Date.now() - 110 * 60 * 60 * 1000), note: 'Approved', actor: 'merchant@returnflow.io' },
        { status: 'LABEL_GENERATED', timestamp: new Date(Date.now() - 109 * 60 * 60 * 1000), note: 'Label created', actor: 'LABEL_WORKER' },
        { status: 'IN_TRANSIT', timestamp: new Date(Date.now() - 80 * 60 * 60 * 1000), note: 'In transit', actor: 'CARRIER_WEBHOOK' },
        { status: 'RECEIVED', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), note: 'Received & inspected', actor: 'warehouse@returnflow.io' },
        { status: 'REFUNDED', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), note: 'Full refund of $210.00 issued to original payment method', actor: 'REFUND_WORKER' },
      ],
    },
    // 7. REJECTED
    {
      returnNumber: 'RET-80107',
      orderNumber: 'ORD-9021',
      customerEmail: 'customer@example.com',
      customerName: 'David Miller',
      items: [
        { sku: 'ACC-USB-C', name: 'Braided Fast Charging Cable', price: 19.99, quantity: 1, reason: 'CHANGED_MIND' },
      ],
      status: 'REJECTED',
      reason: 'CHANGED_MIND',
      customerNote: 'Did not need extra cable.',
      rejectionReason: 'Item package was opened and product policy prohibits returns on used accessory cables.',
      refundAmount: 19.99,
      timeline: [
        { status: 'PENDING_REVIEW', timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000), note: 'Initiated', actor: 'customer@example.com' },
        { status: 'REJECTED', timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000), note: 'Rejected: Item package was opened and product policy prohibits returns on used accessory cables.', actor: 'merchant@returnflow.io' },
      ],
    },
  ];

  await Return.insertMany(returns);
  console.log('[Seed] Database successfully seeded with 3 users, 6 orders, and 7 lifecycle returns!');

  await mongoose.disconnect();
  console.log('[Seed] Disconnected from MongoDB. Seed complete.');
}

seed().catch((err) => {
  console.error('[Seed] Error during seeding:', err);
  process.exit(1);
});
