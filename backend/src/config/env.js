import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters long'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  AWS_REGION: z.string().min(1).default('us-east-1'),
  S3_BUCKET_NAME: z.string().min(1).default('returnflow-demo-bucket'),
  SQS_LABEL_QUEUE_URL: z.string().url().or(z.string().min(1)),
  SQS_REFUND_QUEUE_URL: z.string().url().or(z.string().min(1)),
  SNS_TOPIC_ARN: z.string().min(1).default('arn:aws:sns:us-east-1:123456789012:returnflow-notifications'),
  OPENSEARCH_ENDPOINT: z.string().url().or(z.string().min(1)).default('https://localhost:9200'),
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
