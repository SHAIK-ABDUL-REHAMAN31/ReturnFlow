import { carrierWebhookService } from './carrier.service.js';
import { Errors } from '../../lib/app-error.js';

export class CarrierWebhookController {
  async handleCarrierCallback(req, res, next) {
    try {
      const signature = req.headers['x-carrier-signature'] || req.headers['x-webhook-token'];
      const rawBody = req.rawBody || JSON.stringify(req.body);

      // Verify HMAC or secret token
      if (!signature || !carrierWebhookService.verifySignature(signature, rawBody)) {
        throw Errors.unauthorized('Invalid or missing carrier webhook signature');
      }

      const result = await carrierWebhookService.processCarrierEvent(req.body);
      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const carrierWebhookController = new CarrierWebhookController();
