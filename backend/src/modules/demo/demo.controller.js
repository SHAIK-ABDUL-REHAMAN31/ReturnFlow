import { demoService } from './demo.service.js';

export class DemoController {
  async reseed(_req, res, next) {
    try {
      const result = await demoService.reseedData();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async simulateCarrier(req, res, next) {
    try {
      const { returnNumber, event } = req.body;
      const result = await demoService.simulateCarrierScan(returnNumber, event);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async testIllegalTransition(req, res, next) {
    try {
      const { from, to } = req.body || {};
      demoService.testIllegalTransition(from || 'PENDING_REVIEW', to || 'REFUNDED');
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }
}

export const demoController = new DemoController();
