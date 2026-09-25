import { ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { sqsClient } from '../config/aws.js';
import { env } from '../config/env.js';
import { processLabelJob } from './label-worker.js';
import { processRefundJob } from './refund-worker.js';
import { logger } from '../lib/logger.js';

let isRunning = false;

/**
 * Long-running SQS consumer loop per §1.3 and §4.5.
 * Strictly adheres to at-least-once delivery semantics:
 * Deletes message ONLY after all processing steps have completed.
 */
export async function pollQueue(queueUrl, handler, workerName) {
  if (!queueUrl || queueUrl.includes('mock') || queueUrl.includes('000000000000')) {
    // In local dev without live AWS SQS queues, worker loop remains idle
    return;
  }

  try {
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 5,
      WaitTimeSeconds: 10, // Long-polling to minimize cost and latency
      VisibilityTimeout: 30,
    });

    const response = await sqsClient.send(command);

    if (response.Messages && response.Messages.length > 0) {
      for (const msg of response.Messages) {
        try {
          const body = JSON.parse(msg.Body || '{}');
          await handler(body);

          // Delete from SQS only after successful execution (§1.3 step 7)
          await sqsClient.send(
            new DeleteMessageCommand({
              QueueUrl: queueUrl,
              ReceiptHandle: msg.ReceiptHandle,
            })
          );
          logger.info({ workerName, messageId: msg.MessageId }, 'SQS message processed and deleted');
        } catch (msgErr) {
          logger.error(
            { workerName, messageId: msg.MessageId, error: msgErr.message },
            'Job execution failed — message will be retried via SQS redrive policy / DLQ'
          );
        }
      }
    }
  } catch (err) {
    logger.warn({ workerName, error: err.message }, 'SQS polling loop encounter (will back off)');
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

export async function startWorkerLoops() {
  if (isRunning) return;
  isRunning = true;
  logger.info('Starting ReturnFlow background SQS worker loops...');

  // Concurrently run label and refund polling loops
  (async () => {
    while (isRunning) {
      await pollQueue(env.SQS_LABEL_QUEUE_URL, processLabelJob, 'LABEL_WORKER');
      await new Promise((r) => setTimeout(r, 1000));
    }
  })();

  (async () => {
    while (isRunning) {
      await pollQueue(env.SQS_REFUND_QUEUE_URL, processRefundJob, 'REFUND_WORKER');
      await new Promise((r) => setTimeout(r, 1000));
    }
  })();
}

export function stopWorkerLoops() {
  isRunning = false;
  logger.info('Stopped ReturnFlow SQS worker loops');
}
