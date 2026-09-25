import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';
import { SNSClient } from '@aws-sdk/client-sns';
import { env } from './env.js';

// AWS SDK v3 clients instantiated as singletons using environment region.
// Zero hardcoded credentials per security standard §5.5 & §4.2.
export const s3Client = new S3Client({
  region: env.AWS_REGION,
});

export const sqsClient = new SQSClient({
  region: env.AWS_REGION,
});

export const snsClient = new SNSClient({
  region: env.AWS_REGION,
});
