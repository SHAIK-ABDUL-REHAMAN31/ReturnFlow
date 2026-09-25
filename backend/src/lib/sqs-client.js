import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { sqsClient } from '../config/aws.js';
import { env } from '../config/env.js';
import { logger } from './logger.js';

export class SqsService {
  async sendLabelJob(payload) {
    try {
      const command = new SendMessageCommand({
        QueueUrl: env.SQS_LABEL_QUEUE_URL,
        MessageBody: JSON.stringify(payload),
        MessageAttributes: {
          JobType: {
            DataType: 'String',
            StringValue: 'LABEL_GENERATION',
          },
        },
      });
      await sqsClient.send(command);
      logger.info({ returnId: payload.returnId }, 'Dispatched label generation job to SQS');
    } catch (err) {
      logger.warn({ returnId: payload.returnId, error: err }, 'SQS label job dispatch fallback in dev');
    }
  }

  async sendRefundJob(payload) {
    try {
      const command = new SendMessageCommand({
        QueueUrl: env.SQS_REFUND_QUEUE_URL,
        MessageBody: JSON.stringify(payload),
        MessageAttributes: {
          JobType: {
            DataType: 'String',
            StringValue: 'REFUND_PROCESSING',
          },
        },
      });
      await sqsClient.send(command);
      logger.info({ returnId: payload.returnId, amount: payload.amount }, 'Dispatched refund job to SQS');
    } catch (err) {
      logger.warn({ returnId: payload.returnId, error: err }, 'SQS refund job dispatch fallback in dev');
    }
  }
}

export const sqsService = new SqsService();
