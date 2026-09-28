import { ordersRepository } from './orders.repository.js';
import { returnsRepository } from '../returns/returns.repository.js';
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

    // Query active returns for this order to prevent re-submitting items (§1.1 Fix C)
    const activeReturns = await returnsRepository.findActiveByOrderNumber(order.orderNumber);
    const existingReturnMap = new Map();
    for (const ret of activeReturns) {
      for (const item of ret.items || []) {
        existingReturnMap.set(item.sku, {
          returnNumber: ret.returnNumber,
          status: ret.status,
          returnId: ret._id?.toString(),
          trackingToken: ret.trackingToken,
        });
      }
    }

    // Filter items and consult Redis cache if available
    const eligibleItems = [];
    for (const item of order.items) {
      const cacheKey = `eligibility:${item.sku}`;
      const cached = await cacheService.get(cacheKey);

      const policyAllowed = cached !== null ? cached.isEligible : (item.isEligibleForReturn !== false);
      const existingReturn = existingReturnMap.get(item.sku);
      const returnable = !existingReturn && policyAllowed;

      let reason = null;
      if (existingReturn) {
        reason = 'ALREADY_REQUESTED';
      } else if (!policyAllowed) {
        reason = 'NON_RETURNABLE';
      }

      eligibleItems.push({
        sku: item.sku,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        returnable,
        reason,
        existingReturnStatus: existingReturn ? existingReturn.status : null,
        existingReturnNumber: existingReturn ? existingReturn.returnNumber : null,
        existingTrackingToken: existingReturn ? existingReturn.trackingToken : null,
      });
    }

    const hasReturnableItems = eligibleItems.some((item) => item.returnable);
    const allAlreadyRequested = eligibleItems.length > 0 && eligibleItems.every((item) => item.reason === 'ALREADY_REQUESTED');

    let reasonSummary = undefined;
    if (!hasReturnableItems) {
      if (allAlreadyRequested) {
        reasonSummary = 'All items in this order have already been submitted for return.';
      } else {
        reasonSummary = 'All items in this order are non-returnable or have already been returned.';
      }
    }

    return {
      isEligible: hasReturnableItems,
      reason: reasonSummary,
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      eligibleItems,
      hasExistingReturns: activeReturns.length > 0,
      existingReturns: activeReturns.map((r) => ({
        returnNumber: r.returnNumber,
        status: r.status,
        trackingToken: r.trackingToken,
      })),
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
