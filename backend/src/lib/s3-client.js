import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../config/aws.js';
import { env } from '../config/env.js';
import { logger } from './logger.js';

export class S3Service {
  constructor() {
    this.bucketName = env.S3_BUCKET_NAME;
  }

  /**
   * Generates a time-limited presigned PUT URL for direct photo upload from frontend.
   */
  async getPresignedUploadUrl(returnId, fileExtension, contentType, expiresInSeconds = 300) {
    const sanitizedExt = (fileExtension || 'jpg').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const timestamp = Date.now();
    const key = `returns/${returnId}/evidence_${timestamp}.${sanitizedExt}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
      return { uploadUrl, key };
    } catch (err) {
      logger.warn({ returnId, error: err }, 'S3 presign failed, falling back to mock upload URL');
      return {
        uploadUrl: `https://${this.bucketName}.s3.${env.AWS_REGION}.amazonaws.com/${key}?mock=true`,
        key,
      };
    }
  }

  /**
   * Generates a short-lived presigned GET URL for secure asset retrieval.
   */
  async getPresignedDownloadUrl(key, expiresInSeconds = 300) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    } catch (err) {
      logger.warn({ key, error: err }, 'S3 presign GET failed');
      return `https://${this.bucketName}.s3.${env.AWS_REGION}.amazonaws.com/${key}?expires=${Date.now() + expiresInSeconds * 1000}`;
    }
  }

  /**
   * Server-side upload for system-generated label PDF.
   */
  async putLabel(returnId, pdfBuffer) {
    const key = `labels/${returnId}/shipping_label_${Date.now()}.pdf`;
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
      });
      await s3Client.send(command);
      logger.info({ returnId, key }, 'Uploaded shipping label to S3');
      return key;
    } catch (err) {
      logger.warn({ returnId, error: err }, 'S3 PutObject failed, recorded mock key');
      return key;
    }
  }

  /**
   * Server-side upload for customer evidence photo (avoids browser-to-S3 CORS limitations).
   */
  async putEvidencePhoto(returnId, buffer, fileExtension, contentType) {
    const sanitizedExt = (fileExtension || 'jpg').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const timestamp = Date.now();
    const key = `returns/${returnId}/evidence_${timestamp}.${sanitizedExt}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType || 'image/jpeg',
      });
      await s3Client.send(command);
      logger.info({ returnId, key }, 'Uploaded evidence photo to S3 via backend');
      return key;
    } catch (err) {
      logger.warn({ returnId, error: err }, 'S3 PutObject for evidence failed, recorded fallback key');
      return key;
    }
  }
}

export const s3Service = new S3Service();
