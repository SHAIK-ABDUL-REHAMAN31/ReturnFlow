import { returnsRepository } from './returns.repository.js';
import { ordersService } from '../orders/orders.service.js';
import { assertValidTransition } from './returns.state-machine.js';
import { s3Service } from '../../lib/s3-client.js';
import { sqsService } from '../../lib/sqs-client.js';
import { snsService } from '../../lib/sns-client.js';
import { stepFunctionsService } from '../../lib/stepfunctions-client.js';
import { Errors } from '../../lib/app-error.js';
import { logger } from '../../lib/logger.js';
import { metrics } from '../../lib/metrics.js';

export class ReturnsService {
  async createReturnRequest(dto, user) {
    // 1. Check order eligibility (§1.1)
    const eligibility = await ordersService.checkEligibility(dto.orderNumber, dto.customerEmail);
    if (!eligibility.isEligible) {
      throw Errors.badRequest(eligibility.reason || 'Order is not eligible for return');
    }

    // 2. Validate that returned items exist in the order
    const eligibleSkuMap = new Map(eligibility.eligibleItems.map((item) => [item.sku, item]));
    let calculatedRefund = 0;

    for (const item of dto.items) {
      const match = eligibleSkuMap.get(item.sku);
      if (!match) {
        throw Errors.badRequest(`Item with SKU ${item.sku} is not eligible for return from this order`);
      }
      if (item.quantity > match.quantity) {
        throw Errors.badRequest(
          `Requested return quantity (${item.quantity}) exceeds order quantity (${match.quantity}) for SKU ${item.sku}`
        );
      }
      calculatedRefund += (item.price || match.price) * item.quantity;
    }

    const returnNumber = `RET-${Math.floor(100000 + Math.random() * 900000)}`;

    const returnDoc = await returnsRepository.create({
      returnNumber,
      orderNumber: dto.orderNumber,
      customerEmail: dto.customerEmail,
      customerName: dto.customerName || eligibility.customerName,
      items: dto.items,
      reason: dto.reason,
      customerNote: dto.customerNote || '',
      evidencePhotos: dto.evidencePhotos || [],
      refundAmount: calculatedRefund,
      status: 'PENDING_REVIEW',
      timeline: [
        {
          status: 'PENDING_REVIEW',
          timestamp: new Date(),
          note: 'Return request submitted by customer',
          actor: user?.email || dto.customerEmail,
        },
      ],
    });

    await snsService.publish('return.created', {
      returnId: returnDoc._id.toString(),
      returnNumber,
      orderNumber: dto.orderNumber,
    });

    return returnDoc;
  }

  async approveReturn(returnId, merchantEmail, note) {
    const returnDoc = await returnsRepository.findById(returnId);
    if (!returnDoc) {
      throw Errors.notFound('Return request');
    }

    // Strict state machine validation (§4.4)
    assertValidTransition(returnDoc.status, 'APPROVED');

    const updated = await returnsRepository.updateStatus(
      returnId,
      'APPROVED',
      { merchantNote: note || returnDoc.merchantNote },
      {
        status: 'APPROVED',
        timestamp: new Date(),
        note: note || 'Approved by merchant',
        actor: merchantEmail,
      }
    );

    // Asynchronously dispatch label generation to SQS (§1.2 & §4.5)
    await sqsService.sendLabelJob({
      returnId: returnDoc._id.toString(),
      action: 'GENERATE_LABEL',
      timestamp: new Date().toISOString(),
    });

    // Orchestrate visual state machine via AWS Step Functions (§1.6 Phase 4)
    await stepFunctionsService.startLabelGenerationExecution(
      returnDoc._id.toString(),
      returnDoc.returnNumber
    );

    await snsService.publish('return.approved', {
      returnId: returnDoc._id.toString(),
      returnNumber: returnDoc.returnNumber,
    });

    return {
      return: updated,
      status: 'APPROVED',
      labelStatus: 'processing',
    };
  }

  async rejectReturn(returnId, merchantEmail, rejectionData) {
    const returnDoc = await returnsRepository.findById(returnId);
    if (!returnDoc) {
      throw Errors.notFound('Return request');
    }

    assertValidTransition(returnDoc.status, 'REJECTED');

    let category = null;
    let message = null;
    let reason = null;
    let merchantPhotos = [];

    if (typeof rejectionData === 'object' && rejectionData !== null) {
      category = rejectionData.category || null;
      message = rejectionData.message || null;
      merchantPhotos = Array.isArray(rejectionData.merchantPhotos) ? rejectionData.merchantPhotos : [];
      reason = rejectionData.reason || (category && message ? `[${category}] ${message}` : message || category || 'Return rejected by merchant');
    } else {
      reason = rejectionData || 'Return rejected by merchant';
    }

    const updates = {
      rejectionReason: reason,
      rejectionCategory: category,
      rejectionMessage: message || reason,
    };
    if (merchantPhotos.length > 0) {
      updates.merchantEvidencePhotos = merchantPhotos;
    }

    const updated = await returnsRepository.updateStatus(
      returnId,
      'REJECTED',
      updates,
      {
        status: 'REJECTED',
        timestamp: new Date(),
        note: `Rejected: ${reason}`,
        actor: merchantEmail,
      }
    );

    await snsService.publish('return.rejected', {
      returnId: returnDoc._id.toString(),
      returnNumber: returnDoc.returnNumber,
      rejectionReason: reason,
      rejectionCategory: category,
    });

    return updated;
  }

  async markReceived(returnId, merchantEmail, note) {
    const returnDoc = await returnsRepository.findById(returnId);
    if (!returnDoc) {
      throw Errors.notFound('Return request');
    }

    // Must be IN_TRANSIT (or LABEL_GENERATED for local mock simulation)
    if (returnDoc.status === 'LABEL_GENERATED') {
      // Advance to IN_TRANSIT first for workflow realism
      await returnsRepository.updateStatus(returnId, 'IN_TRANSIT', {}, {
        status: 'IN_TRANSIT',
        timestamp: new Date(),
        note: 'Package picked up by carrier',
        actor: 'CARRIER_SERVICE',
      });
      returnDoc.status = 'IN_TRANSIT';
    }

    assertValidTransition(returnDoc.status, 'RECEIVED');

    const updated = await returnsRepository.updateStatus(
      returnId,
      'RECEIVED',
      {},
      {
        status: 'RECEIVED',
        timestamp: new Date(),
        note: note || 'Items inspected and received at fulfillment warehouse',
        actor: merchantEmail,
      }
    );

    // Dispatch refund job with idempotency key (§1.4)
    const idempotencyKey = `refund:${returnDoc._id.toString()}:${Date.now()}`;
    await sqsService.sendRefundJob({
      returnId: returnDoc._id.toString(),
      orderId: returnDoc.orderNumber,
      amount: returnDoc.refundAmount,
      idempotencyKey,
      timestamp: new Date().toISOString(),
    });

    await snsService.publish('return.received', {
      returnId: returnDoc._id.toString(),
      returnNumber: returnDoc.returnNumber,
    });

    return updated;
  }

  async processRefund(returnId, merchantEmail, refundAmount, note) {
    const returnDoc = await returnsRepository.findById(returnId);
    if (!returnDoc) {
      throw Errors.notFound('Return request');
    }

    assertValidTransition(returnDoc.status, 'REFUNDED');

    const finalAmount = typeof refundAmount === 'number' ? refundAmount : returnDoc.refundAmount;

    const updated = await returnsRepository.updateStatus(
      returnId,
      'REFUNDED',
      { refundAmount: finalAmount },
      {
        status: 'REFUNDED',
        timestamp: new Date(),
        note: note || `Refund of $${finalAmount.toFixed(2)} processed successfully`,
        actor: merchantEmail,
      }
    );

    await snsService.publish('return.refunded', {
      returnId: returnDoc._id.toString(),
      returnNumber: returnDoc.returnNumber,
      amount: finalAmount,
    });

    return updated;
  }

  async getPresignedUploadUrl(returnId, fileExtension, contentType) {
    const returnDoc = await returnsRepository.findById(returnId);
    if (!returnDoc) {
      throw Errors.notFound('Return request');
    }

    const { uploadUrl, key } = await s3Service.getPresignedUploadUrl(
      returnId,
      fileExtension,
      contentType
    );

    // Record photo key in the return document
    await returnsRepository.addEvidencePhoto(returnId, key);

    return { uploadUrl, key };
  }

  async uploadEvidencePhoto(returnId, file, isMerchant = false) {
    const returnDoc = await returnsRepository.findById(returnId);
    if (!returnDoc) {
      throw Errors.notFound('Return request');
    }

    const ext = file.originalname?.split('.').pop() || 'jpg';
    const key = await s3Service.putEvidencePhoto(
      returnId,
      file.buffer,
      ext,
      file.mimetype
    );

    if (isMerchant) {
      await returnsRepository.addMerchantEvidencePhoto(returnId, key);
    } else {
      await returnsRepository.addEvidencePhoto(returnId, key);
    }

    let downloadUrl = null;
    try {
      downloadUrl = await s3Service.getPresignedDownloadUrl(key, 3600);
    } catch {
      downloadUrl = null;
    }

    return { success: true, key, downloadUrl };
  }

  async getReturnById(returnId) {
    const returnDoc = await returnsRepository.findById(returnId);
    if (!returnDoc) {
      throw Errors.notFound('Return request');
    }

    const docObj = returnDoc.toObject ? returnDoc.toObject() : { ...returnDoc };

    // Resolve presigned GET URLs for customer evidence photos
    if (Array.isArray(docObj.evidencePhotos) && docObj.evidencePhotos.length > 0) {
      docObj.evidencePhotoUrls = await Promise.all(
        docObj.evidencePhotos.map(async (key) => {
          try {
            return await s3Service.getPresignedDownloadUrl(key, 3600);
          } catch {
            return null;
          }
        })
      );
    } else {
      docObj.evidencePhotoUrls = [];
    }

    // Resolve presigned GET URLs for merchant evidence photos
    if (Array.isArray(docObj.merchantEvidencePhotos) && docObj.merchantEvidencePhotos.length > 0) {
      docObj.merchantEvidencePhotoUrls = await Promise.all(
        docObj.merchantEvidencePhotos.map(async (key) => {
          try {
            return await s3Service.getPresignedDownloadUrl(key, 3600);
          } catch {
            return null;
          }
        })
      );
    } else {
      docObj.merchantEvidencePhotoUrls = [];
    }

    return docObj;
  }

  async listReturns(query) {
    return returnsRepository.list(query);
  }

  async getDashboardMetrics() {
    return returnsRepository.getMetrics();
  }

  /**
   * Generates a time-limited presigned GET URL for downloading shipping label PDF (§4.6)
   */
  async getPresignedLabelDownloadUrl(returnId) {
    const returnDoc = await returnsRepository.findById(returnId);
    if (!returnDoc) {
      throw Errors.notFound('Return request');
    }

    if (!returnDoc.labelKey) {
      throw Errors.badRequest('No shipping label has been generated for this return yet');
    }

    const downloadUrl = await s3Service.getPresignedDownloadUrl(returnDoc.labelKey, 300);
    return {
      downloadUrl,
      labelKey: returnDoc.labelKey,
      returnNumber: returnDoc.returnNumber,
    };
  }
}

export const returnsService = new ReturnsService();
