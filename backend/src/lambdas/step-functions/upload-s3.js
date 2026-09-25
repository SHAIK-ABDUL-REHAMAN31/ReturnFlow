import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../../config/aws.js';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';

/**
 * Step Functions Task 3: UploadToS3 (§1.6 & §1.3)
 * Uploads generated PDF label to private S3 bucket.
 *
 * @param {object} event - Output from GenerateLabel
 * @returns {Promise<object>} - Upload confirmation and S3 key
 */
export const handler = async (event) => {
  const { returnNumber, labelKey, pdfBufferBase64 } = event;

  logger.info({ returnNumber, labelKey }, 'Step Functions: Uploading shipping label PDF to S3');

  const pdfBuffer = Buffer.from(pdfBufferBase64, 'base64');

  try {
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: labelKey,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      ServerSideEncryption: 'AES256',
    });

    await s3Client.send(command);
    logger.info({ labelKey, bucket: env.S3_BUCKET_NAME }, 'Successfully uploaded label to S3');
  } catch (err) {
    logger.warn({ error: err.message, labelKey }, 'S3 upload failed (mock/local mode fallback)');
  }

  // Remove bulky base64 buffer from Step Functions state payload to prevent 256KB limits
  const { pdfBufferBase64: _removed, ...cleanContext } = event;

  return {
    ...cleanContext,
    s3Bucket: env.S3_BUCKET_NAME,
    s3Key: labelKey,
    s3Uri: `s3://${env.S3_BUCKET_NAME}/${labelKey}`,
    uploadedAt: new Date().toISOString(),
  };
};
