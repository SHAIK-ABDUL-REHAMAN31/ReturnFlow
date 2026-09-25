import { ReturnModel } from '../returns/returns.model.js';

export class AnalyticsService {
  async getReverseLogisticsAnalytics() {
    const [reasonAgg, skuAgg, statusAgg, resolutionAgg] = await Promise.all([
      // 1. Returns by Reason Breakdown
      ReturnModel.aggregate([
        {
          $group: {
            _id: '$reason',
            count: { $sum: 1 },
            totalRefund: { $sum: '$refundAmount' },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // 2. Top Returned Items / SKUs
      ReturnModel.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.sku',
            name: { $first: '$items.name' },
            returnCount: { $sum: '$items.quantity' },
            totalValue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { returnCount: -1 } },
        { $limit: 10 },
      ]),

      // 3. Status Distribution
      ReturnModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // 4. Average Resolution Turnaround Time (creation to completion)
      ReturnModel.aggregate([
        { $match: { status: 'REFUNDED' } },
        {
          $project: {
            resolutionHours: {
              $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 1000 * 60 * 60],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgHours: { $avg: '$resolutionHours' },
            minHours: { $min: '$resolutionHours' },
            maxHours: { $max: '$resolutionHours' },
          },
        },
      ]),
    ]);

    const totalReturns = reasonAgg.reduce((acc, curr) => acc + curr.count, 0);

    const reasons = reasonAgg.map((r) => ({
      reason: r._id,
      count: r.count,
      percentage: totalReturns > 0 ? Math.round((r.count / totalReturns) * 100) : 0,
      totalRefund: r.totalRefund,
    }));

    const topSkus = skuAgg.map((s) => ({
      sku: s._id,
      name: s.name,
      returnCount: s.returnCount,
      totalValue: s.totalValue,
    }));

    const statusCounts = {};
    statusAgg.forEach((s) => {
      statusCounts[s._id] = s.count;
    });

    const resolutionStats = resolutionAgg[0] || { avgHours: 24, minHours: 2, maxHours: 72 };

    return {
      totalReturns,
      reasons,
      topSkus,
      statusCounts,
      resolutionStats: {
        avgHours: Math.round(resolutionStats.avgHours || 24),
        minHours: Math.round(resolutionStats.minHours || 2),
        maxHours: Math.round(resolutionStats.maxHours || 72),
      },
    };
  }
}

export const analyticsService = new AnalyticsService();
