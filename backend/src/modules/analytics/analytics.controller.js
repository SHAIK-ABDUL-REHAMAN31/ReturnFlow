import { analyticsService } from './analytics.service.js';

export class AnalyticsController {
  async getAnalytics(_req, res, next) {
    try {
      const data = await analyticsService.getReverseLogisticsAnalytics();
      res.status(200).json({ analytics: data });
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
