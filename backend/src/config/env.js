import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from backend/.env or current working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required').default('mongodb://localhost:27017/returnflow-test'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters long').default('local_dev_access_secret_min_32_characters_long_12345'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long').default('local_dev_refresh_secret_min_32_characters_long_12345'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required').default('redis://localhost:6379'),
  AWS_REGION: z.string().min(1).default('us-east-1'),
  S3_BUCKET_NAME: z.string().min(1).default('returnflow-demo-bucket'),
  SQS_LABEL_QUEUE_URL: z.string().url().or(z.string().min(1)).default('https://sqs.us-east-1.amazonaws.com/123456789012/test-label-queue'),
  SQS_REFUND_QUEUE_URL: z.string().url().or(z.string().min(1)).default('https://sqs.us-east-1.amazonaws.com/123456789012/test-refund-queue'),
  SNS_TOPIC_ARN: z.string().min(1).default('arn:aws:sns:us-east-1:123456789012:returnflow-notifications'),
  OPENSEARCH_ENDPOINT: z.string().url().or(z.string().min(1)).default('https://localhost:9200'),
  STEP_FUNCTIONS_LABEL_ARN: z.string().optional().default('arn:aws:states:us-east-1:123456789012:stateMachine:returnflow-label-generation'),
  FRONTEND_URL: z.string().url().or(z.string().min(1)).default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('CRITICAL: Environment variable validation failed:');
  for (const issue of parsed.error.issues) {
    console.error(` - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
