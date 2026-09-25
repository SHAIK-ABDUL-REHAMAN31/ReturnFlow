import { OrderModel } from './orders.model.js';

export class OrdersRepository {
  async findByOrderNumber(orderNumber) {
    return OrderModel.findOne({ orderNumber: orderNumber.trim() }).exec();
  }

  async findById(id) {
    return OrderModel.findById(id).exec();
  }

  async findByCustomerEmail(email) {
    return OrderModel.find({ customerEmail: email.toLowerCase().trim() })
      .sort({ createdAt: -1 })
      .exec();
  }

  async listRecent(limit = 50) {
    return OrderModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async create(data) {
    return OrderModel.create(data);
  }
}

export const ordersRepository = new OrdersRepository();
