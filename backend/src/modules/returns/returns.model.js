import mongoose, { Schema } from 'mongoose';

const ReturnItemSchema = new Schema(
  {
    sku: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    reason: { type: String },
  },
  { _id: false }
);

const TimelineEventSchema = new Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
    actor: { type: String, default: 'SYSTEM' },
  },
  { _id: false }
);

const ReturnSchema = new Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    items: [ReturnItemSchema],
    status: {
      type: String,
      enum: [
        'PENDING_REVIEW',
        'APPROVED',
        'LABEL_GENERATED',
        'IN_TRANSIT',
        'RECEIVED',
        'REFUNDED',
        'REJECTED',
      ],
      default: 'PENDING_REVIEW',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    customerNote: {
      type: String,
      default: '',
    },
    merchantNote: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    rejectionCategory: {
      type: String,
      default: null,
    },
    rejectionMessage: {
      type: String,
      default: null,
    },
    merchantEvidencePhotos: {
      type: [String],
      default: [],
    },
    evidencePhotos: {
      type: [String],
      default: [],
    },
    labelKey: {
      type: String,
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    timeline: [TimelineEventSchema],
  },
  {
    timestamps: true,
  }
);

export const ReturnModel = mongoose.model('Return', ReturnSchema);
