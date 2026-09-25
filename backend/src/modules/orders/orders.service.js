import { ordersRepository } from './orders.repository.js';
import { cacheService } from '../../lib/cache.service.js';
import { Errors } from '../../lib/app-error.js';

export class OrdersService {
  constructor() {
    this.returnWindowDays = 30;
  }

  async checkEligibility(orderNumber, customerEmail) {
    const order = await ordersRepository.findByOrderNumber(orderNumber);
    if (!order) {
      throw Errors.notFound(`Order with number ${orderNumber}`);
    }

    if (customerEmail && order.customerEmail.toLowerCase() !== customerEmail.toLowerCase().trim()) {
      throw Errors.forbidden('Order does not match customer details');
    }

    if (order.status !== 'DELIVERED') {
      return {
        isEligible: false,
        reason: `Order is currently in ${order.status} status and cannot be returned yet`,
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        eligibleItems: [],
      };
    }

    // Check delivery return window (30 days)
    const deliveredDate = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.createdAt);
    const daysSinceDelivery = Math.floor((Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceDelivery > this.returnWindowDays) {
      return {
        isEligible: false,
        reason: `Order was delivered ${daysSinceDelivery} days ago, exceeding the ${this.returnWindowDays}-day return window`,
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        eligibleItems: [],
      };
    }

    // Filter items and consult Redis cache if available
    const eligibleItems = [];
    for (const item of order.items) {
      const cacheKey = `eligibility:${item.sku}`;
      const cached = await cacheService.get(cacheKey);

      const isAllowed = cached !== null ? cached.isEligible : (item.isEligibleForReturn !== false);
      if (isAllowed) {
        eligibleItems.push({
          sku: item.sku,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        });
      }
    }

    return {
      isEligible: eligibleItems.length > 0,
      reason: eligibleItems.length === 0 ? 'All items in this order are non-returnable' : undefined,
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      eligibleItems,
    };
  }

  async getOrderByNumber(orderNumber) {
    const order = await ordersRepository.findByOrderNumber(orderNumber);
    if (!order) {
      throw Errors.notFound(`Order ${orderNumber}`);
    }
    return order;
  }

  async listOrders() {
    return ordersRepository.listRecent();
  }
}

export const ordersService = new OrdersService();
