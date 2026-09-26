# ==============================================================================
# ReturnFlow - Deploy Step Functions Lambdas
# ==============================================================================
$ErrorActionPreference = "Continue"
$env:AWS_PROFILE = "returnflow-new"
$REGION = "us-east-1"
$ROLE_ARN = "arn:aws:iam::006635110818:role/returnflow-lambda-role"
$DIST = "infra/step-functions/dist"

New-Item -ItemType Directory -Force -Path "$DIST/validate" | Out-Null
New-Item -ItemType Directory -Force -Path "$DIST/generate" | Out-Null
New-Item -ItemType Directory -Force -Path "$DIST/upload" | Out-Null
New-Item -ItemType Directory -Force -Path "$DIST/update" | Out-Null

# 1. ValidateReturn
@'
export const handler = async (event) => {
  const { returnId, returnNumber, customerName, customerEmail, items } = event;
  if (!returnId && !returnNumber) {
    throw new Error('ValidationError: Missing returnId or returnNumber');
  }
  console.log(`[ValidateReturn] Validating return: ${returnNumber || returnId}`);
  return {
    returnId: returnId || 'ret-demo-101',
    returnNumber: returnNumber || 'RET-80101',
    customerName: customerName || 'David Miller',
    customerEmail: customerEmail || 'customer@example.com',
    items: items || [],
    validatedAt: new Date().toISOString(),
  };
};
'@ | Set-Content -Path "$DIST/validate/index.mjs"
Compress-Archive -Path "$DIST/validate/*" -DestinationPath "$DIST/validate.zip" -Force

# 2. GenerateLabel
@'
import crypto from "node:crypto";

export const handler = async (event) => {
  const { returnId, returnNumber, customerName } = event;
  console.log(`[GenerateLabel] Generating carrier shipping label for: ${returnNumber}`);

  const randomSuffix = crypto.randomBytes(8).toString('hex').toUpperCase();
  const trackingNumber = `1Z${randomSuffix}`;
  const carrier = 'UPS';
  const labelKey = `labels/${returnNumber || 'RET-000'}-${Date.now()}.pdf`;

  const pdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 400 600] /Contents 4 0 R >> endobj
4 0 obj << /Length 120 >> stream
BT
/F1 16 Tf
50 550 Td
(RETURNFLOW PRE-PAID RETURN LABEL) Tj
/F1 12 Tf
0 -30 Td
(Return: ${returnNumber}) Tj
0 -20 Td
(Tracking: ${trackingNumber} - ${carrier}) Tj
0 -20 Td
(Customer: ${customerName || 'Valued Customer'}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000216 00000 n 
trailer << /Size 5 /Root 1 0 R >>
%%EOF`;

  const pdfBufferBase64 = Buffer.from(pdfContent).toString('base64');

  return {
    ...event,
    trackingNumber,
    carrier,
    labelKey,
    pdfBufferBase64,
    generatedAt: new Date().toISOString(),
  };
};
'@ | Set-Content -Path "$DIST/generate/index.mjs"
Compress-Archive -Path "$DIST/generate/*" -DestinationPath "$DIST/generate.zip" -Force

# 3. UploadToS3
@'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const BUCKET = process.env.S3_BUCKET_NAME || "returnflow-abdul-bucket";

export const handler = async (event) => {
  const { returnNumber, labelKey, pdfBufferBase64 } = event;
  console.log(`[UploadToS3] Uploading label PDF to S3: ${BUCKET}/${labelKey}`);

  const pdfBuffer = Buffer.from(pdfBufferBase64, "base64");

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: labelKey,
      Body: pdfBuffer,
      ContentType: "application/pdf",
      ServerSideEncryption: "AES256",
    });
    await s3.send(command);
    console.log(`[UploadToS3] Successfully uploaded to S3: ${labelKey}`);
  } catch (err) {
    console.error(`[UploadToS3] Error: ${err.message}`);
    throw err;
  }

  const { pdfBufferBase64: _removed, ...cleanContext } = event;

  return {
    ...cleanContext,
    s3Bucket: BUCKET,
    s3Key: labelKey,
    s3Uri: `s3://${BUCKET}/${labelKey}`,
    uploadedAt: new Date().toISOString(),
  };
};
'@ | Set-Content -Path "$DIST/upload/index.mjs"
Compress-Archive -Path "$DIST/upload/*" -DestinationPath "$DIST/upload.zip" -Force

# 4. UpdateStatus
@'
export const handler = async (event) => {
  const { returnId, returnNumber, trackingNumber, labelKey, carrier, s3Uri } = event;
  console.log(`[UpdateStatus] Advancing status to LABEL_GENERATED for ${returnNumber}`);

  return {
    returnId,
    returnNumber,
    status: 'LABEL_GENERATED',
    trackingNumber,
    labelKey,
    s3Uri,
    carrier: carrier || 'UPS',
    completedAt: new Date().toISOString(),
    event: 'LABEL_READY',
  };
};
'@ | Set-Content -Path "$DIST/update/index.mjs"
Compress-Archive -Path "$DIST/update/*" -DestinationPath "$DIST/update.zip" -Force

Write-Host "Zipped all 4 Lambda functions." -ForegroundColor Green

$lambdas = @(
    @{ Name = "returnflow-validate-return"; Zip = "$DIST/validate.zip" },
    @{ Name = "returnflow-generate-label"; Zip = "$DIST/generate.zip" },
    @{ Name = "returnflow-upload-s3"; Zip = "$DIST/upload.zip" },
    @{ Name = "returnflow-update-status"; Zip = "$DIST/update.zip" }
)

foreach ($l in $lambdas) {
    Write-Host "Deploying Lambda: $($l.Name)..." -ForegroundColor Yellow
    $zipBytes = "fileb://" + (Resolve-Path $l.Zip)
    $existing = aws lambda list-functions --query "Functions[?FunctionName=='$($l.Name)'].FunctionName" --output text
    if ($existing -eq $l.Name) {
        aws lambda update-function-code --function-name $l.Name --zip-file $zipBytes | Out-Null
        Write-Host "  ✔ Updated code for $($l.Name)" -ForegroundColor Green
    } else {
        aws lambda create-function `
            --function-name $l.Name `
            --runtime nodejs20.x `
            --role $ROLE_ARN `
            --handler index.handler `
            --zip-file $zipBytes `
            --environment 'Variables={S3_BUCKET_NAME=returnflow-abdul-bucket,AWS_REGION=us-east-1}' `
            --timeout 15 `
            --memory-size 256 | Out-Null
        Write-Host "  ✔ Created Lambda $($l.Name)" -ForegroundColor Green
    }
}

Write-Host "All 4 Lambda functions deployed successfully!" -ForegroundColor Green
