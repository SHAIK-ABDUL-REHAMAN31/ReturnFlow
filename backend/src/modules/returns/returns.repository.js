import { ReturnModel } from './returns.model.js';

export class ReturnsRepository {
  async findById(id) {
    return ReturnModel.findById(id).exec();
  }

  async findByReturnNumber(returnNumber) {
    return ReturnModel.findOne({ returnNumber }).exec();
  }

  async create(data) {
    return ReturnModel.create(data);
  }

  async updateStatus(id, newStatus, updates = {}, timelineEvent = null) {
    const updateDoc = {
      $set: {
        status: newStatus,
        ...updates,
      },
    };

    if (timelineEvent) {
      updateDoc.$push = { timeline: timelineEvent };
    }

    return ReturnModel.findByIdAndUpdate(id, updateDoc, { new: true }).exec();
  }

  async updateIdempotencyKey(id, idempotencyKey) {
    return ReturnModel.findByIdAndUpdate(id, { idempotencyKey }, { new: true }).exec();
  }

  async list({ status, search, page = 1, limit = 20 }) {
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      const sanitized = search.trim();
      query.$or = [
        { returnNumber: { $regex: sanitized, $options: 'i' } },
        { orderNumber: { $regex: sanitized, $options: 'i' } },
        { customerEmail: { $regex: sanitized, $options: 'i' } },
        { customerName: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [items, total] = await Promise.all([
      ReturnModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.min(limit, 50)) // Enforce 50 max page size (§1.5)
        .exec(),
      ReturnModel.countDocuments(query).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMetrics() {
    const aggregation = await ReturnModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRefund: { $sum: '$refundAmount' },
        },
      },
    ]);

    const metrics = {
      total: 0,
      PENDING_REVIEW: 0,
      APPROVED: 0,
      LABEL_GENERATED: 0,
      IN_TRANSIT: 0,
      RECEIVED: 0,
      REFUNDED: 0,
      REJECTED: 0,
      totalRefundedAmount: 0,
    };

    for (const group of aggregation) {
      if (group._id in metrics) {
        metrics[group._id] = group.count;
      }
      metrics.total += group.count;
      if (group._id === 'REFUNDED') {
        metrics.totalRefundedAmount = group.totalRefund;
      }
    }

    return metrics;
  }
}

export const returnsRepository = new ReturnsRepository();
