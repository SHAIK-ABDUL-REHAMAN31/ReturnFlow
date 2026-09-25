import { PublishCommand } from '@aws-sdk/client-sns';
import { snsClient } from '../config/aws.js';
import { env } from '../config/env.js';
import { logger } from './logger.js';

export class SnsService {
  async publish(event, payload) {
    const message = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      ...payload,
    });

    try {
      const command = new PublishCommand({
        TopicArn: env.SNS_TOPIC_ARN,
        Message: message,
        MessageAttributes: {
          Event: {
            DataType: 'String',
            StringValue: event,
          },
        },
      });

      await snsClient.send(command);
      logger.info({ event, returnId: payload.returnId }, 'Published notification to SNS');
    } catch (err) {
      logger.warn({ event, returnId: payload.returnId, error: err }, 'SNS publish fallback in dev');
    }
  }
}

export const snsService = new SnsService();
