import { returnsRepository } from '../modules/returns/returns.repository.js';
import { s3Service } from '../lib/s3-client.js';
import { snsService } from '../lib/sns-client.js';
import { logger } from '../lib/logger.js';

/**
 * SQS consumer worker for shipping label generation per §4.5.
 * Strictly idempotent: verifies return status is still APPROVED before generating.
 */
export async function processLabelJob(jobData) {
  const { returnId } = jobData;
  if (!returnId) {
    logger.warn({ jobData }, 'Malformed label job payload, dropping');
    return;
  }

  const returnDoc = await returnsRepository.findById(returnId);
  if (!returnDoc) {
    logger.warn({ returnId }, 'Return not found during label processing');
    return;
  }

  // Idempotency guard per §4.5: defends against stale / duplicate SQS delivery
  if (returnDoc.status !== 'APPROVED') {
    logger.info({ returnId, status: returnDoc.status }, 'Return is not in APPROVED state, skipping label generation');
    return;
  }

  try {
    // Generate minimal valid PDF buffer in-memory (no disk leak §1.3)
    const pdfContent = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 300 500]/Parent 2 0 R/Contents 4 0 R>>endobj\n4 0 obj<</Length 85>>stream\nBT /F1 14 Tf 50 450 Td (RETURNFLOW SHIPPING LABEL) Tj ET\nBT /F1 10 Tf 50 420 Td (${returnDoc.returnNumber}) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000212 00000 n\ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n349\n%%EOF`;
    const pdfBuffer = Buffer.from(pdfContent, 'utf-8');

    const labelKey = await s3Service.putLabel(returnId, pdfBuffer);

    await returnsRepository.updateStatus(
      returnId,
      'LABEL_GENERATED',
      { labelKey },
      {
        status: 'LABEL_GENERATED',
        timestamp: new Date(),
        note: `Shipping label generated and stored in S3 (${labelKey})`,
        actor: 'LABEL_WORKER',
      }
    );

    await snsService.publish('label.ready', {
      returnId,
      returnNumber: returnDoc.returnNumber,
      labelKey,
    });

    logger.info({ returnId, labelKey }, 'Label generation completed successfully');
  } catch (err) {
    logger.error({ returnId, error: err }, 'Failed to generate label');
    throw err;
  }
}
