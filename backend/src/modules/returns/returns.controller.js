import { returnsService } from './returns.service.js';

export class ReturnsController {
  async createReturn(req, res, next) {
    try {
      const returnDoc = await returnsService.createReturnRequest(req.body, req.user);
      res.status(201).json({ return: returnDoc });
    } catch (err) {
      next(err);
    }
  }

  async getReturn(req, res, next) {
    try {
      const { id } = req.params;
      const returnDoc = await returnsService.getReturnById(id);
      res.status(200).json({ return: returnDoc });
    } catch (err) {
      next(err);
    }
  }

  async listReturns(req, res, next) {
    try {
      const { status, search, page, limit } = req.query;
      const result = await returnsService.listReturns({
        status,
        search,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getMetrics(_req, res, next) {
    try {
      const metrics = await returnsService.getDashboardMetrics();
      res.status(200).json({ metrics });
    } catch (err) {
      next(err);
    }
  }

  async approveReturn(req, res, next) {
    try {
      const { id } = req.params;
      const { note } = req.body || {};
      const result = await returnsService.approveReturn(id, req.user.email, note);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async rejectReturn(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const returnDoc = await returnsService.rejectReturn(id, req.user.email, reason);
      res.status(200).json({ return: returnDoc });
    } catch (err) {
      next(err);
    }
  }

  async markReceived(req, res, next) {
    try {
      const { id } = req.params;
      const { note } = req.body || {};
      const returnDoc = await returnsService.markReceived(id, req.user.email, note);
      res.status(200).json({ return: returnDoc });
    } catch (err) {
      next(err);
    }
  }

  async refundReturn(req, res, next) {
    try {
      const { id } = req.params;
      const { refundAmount, note } = req.body || {};
      const returnDoc = await returnsService.processRefund(id, req.user.email, refundAmount, note);
      res.status(200).json({ return: returnDoc });
    } catch (err) {
      next(err);
    }
  }

  async getUploadUrl(req, res, next) {
    try {
      const { id } = req.params;
      const { fileExtension, contentType } = req.body || {};
      const result = await returnsService.getPresignedUploadUrl(id, fileExtension, contentType);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const returnsController = new ReturnsController();
