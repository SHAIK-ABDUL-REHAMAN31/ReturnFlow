import { ordersService } from './orders.service.js';

export class OrdersController {
  async checkEligibility(req, res, next) {
    try {
      const { orderNumber } = req.params;
      const { email } = req.query;
      const result = await ordersService.checkEligibility(orderNumber, email);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getOrder(req, res, next) {
    try {
      const { orderNumber } = req.params;
      const order = await ordersService.getOrderByNumber(orderNumber);
      res.status(200).json({ order });
    } catch (err) {
      next(err);
    }
  }

  async listOrders(_req, res, next) {
    try {
      const orders = await ordersService.listOrders();
      res.status(200).json({ orders });
    } catch (err) {
      next(err);
    }
  }
}

export const ordersController = new OrdersController();
