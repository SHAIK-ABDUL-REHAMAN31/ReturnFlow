# ==============================================================================
# ReturnFlow — Automated AWS Free-Tier Infrastructure Provisioner (PowerShell)
# Provisions: IAM CI/CD user, S3 bucket with CORS, SQS queues + DLQs, SNS topic, ECR repos
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "       ReturnFlow Automated AWS Setup & Connection Script       " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Verify AWS CLI
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] AWS CLI is not installed or not in your PATH." -ForegroundColor Red
    Write-Host "Download and install AWS CLI from: https://aws.amazon.com/cli/"
    Write-Host "Then run 'aws configure' in terminal."
    exit 1
}

Write-Host "`n[1/6] Verifying AWS CLI authentication..." -ForegroundColor Yellow
try {
    $callerJson = aws sts get-caller-identity --output json | ConvertFrom-Json
} catch {
    Write-Host "[ERROR] Could not authenticate with AWS. Please run 'aws configure'." -ForegroundColor Red
    exit 1
}

$accountId = $callerJson.Account
$callerArn = $callerJson.Arn
$region = if ($env:AWS_REGION) { $env:AWS_REGION } else { "us-east-1" }

Write-Host "  ✔ Authenticated as: $callerArn" -ForegroundColor Green
Write-Host "  ✔ AWS Account ID:   $accountId" -ForegroundColor Green
Write-Host "  ✔ Target Region:    $region" -ForegroundColor Green

# Unique S3 bucket suffix
$defaultSuffix = $accountId.Substring($accountId.Length - 4)
$userSuffix = Read-Host "Enter a unique suffix for your S3 bucket [default: $defaultSuffix]"
if ([string]::IsNullOrWhiteSpace($userSuffix)) { $userSuffix = $defaultSuffix }
$bucketName = "returnflow-$userSuffix-bucket"

# ------------------------------------------------------------------------------
# STEP 1: IAM User for CI/CD
# ------------------------------------------------------------------------------
Write-Host "`n[2/6] Setting up IAM CI/CD User (returnflow-ci-cd)..." -ForegroundColor Yellow
$userExists = aws iam get-user --user-name returnflow-ci-cd 2>$null
if (-not $userExists) {
    aws iam create-user --user-name returnflow-ci-cd | Out-Null
    Write-Host "  Created IAM user 'returnflow-ci-cd'." -ForegroundColor Gray
} else {
    Write-Host "  IAM user 'returnflow-ci-cd' already exists." -ForegroundColor Gray
}

aws iam attach-user-policy --user-name returnflow-ci-cd --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser
aws iam attach-user-policy --user-name returnflow-ci-cd --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess
Write-Host "  ✔ Attached ECR & ECS deployment policies." -ForegroundColor Green

$newKeyId = $null
$newSecretKey = $null
try {
    $keyJson = aws iam create-access-key --user-name returnflow-ci-cd --output json | ConvertFrom-Json
    $newKeyId = $keyJson.AccessKey.AccessKeyId
    $newSecretKey = $keyJson.AccessKey.SecretAccessKey
    Write-Host "  ✔ Generated fresh CI/CD access key." -ForegroundColor Green
} catch {
    Write-Host "  (Access key already exists or maximum 2 keys active; use your existing IAM key)" -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# STEP 2: S3 Bucket with Block Public Access + CORS
# ------------------------------------------------------------------------------
Write-Host "`n[3/6] Setting up S3 Bucket ($bucketName)..." -ForegroundColor Yellow
try {
    if ($region -eq "us-east-1") {
        aws s3api create-bucket --bucket $bucketName --region $region | Out-Null
    } else {
        aws s3api create-bucket --bucket $bucketName --region $region --create-bucket-configuration LocationConstraint=$region | Out-Null
    }
} catch {
    # Bucket may already exist or owned by account
}

aws s3api put-public-access-block --bucket $bucketName --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

$corsJson = '{"CORSRules":[{"AllowedHeaders":["*"],"AllowedMethods":["PUT","GET","HEAD"],"AllowedOrigins":["http://localhost:3000","https://*.cloudfront.net"],"ExposeHeaders":["ETag"]}]}'
aws s3api put-bucket-cors --bucket $bucketName --cors-configuration $corsJson
Write-Host "  ✔ S3 bucket '$bucketName' configured with private ACL and CORS." -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 3: SQS Queues + DLQs
# ------------------------------------------------------------------------------
Write-Host "`n[4/6] Setting up SQS Queues & DLQs with redrive policy (maxReceiveCount=3)..." -ForegroundColor Yellow
aws sqs create-queue --queue-name returnflow-label-dlq --region $region 2>$null | Out-Null
aws sqs create-queue --queue-name returnflow-refund-dlq --region $region 2>$null | Out-Null

$labelDlqArn = (aws sqs get-queue-attributes --queue-url "https://sqs.$region.amazonaws.com/$accountId/returnflow-label-dlq" --attribute-names QueueArn --region $region --output text).Split()[-1]
$refundDlqArn = (aws sqs get-queue-attributes --queue-url "https://sqs.$region.amazonaws.com/$accountId/returnflow-refund-dlq" --attribute-names QueueArn --region $region --output text).Split()[-1]

$labelRedrive = "{\`"deadLetterTargetArn\`":\`"$labelDlqArn\`",\`"maxReceiveCount\`":\`"3\`"}"
$refundRedrive = "{\`"deadLetterTargetArn\`":\`"$refundDlqArn\`",\`"maxReceiveCount\`":\`"3\`"}"

aws sqs create-queue --queue-name returnflow-label-queue --attributes "{\`"RedrivePolicy\`":\`"$labelRedrive\`"}" --region $region 2>$null | Out-Null
aws sqs create-queue --queue-name returnflow-refund-queue --attributes "{\`"RedrivePolicy\`":\`"$refundRedrive\`"}" --region $region 2>$null | Out-Null

$labelQueueUrl = "https://sqs.$region.amazonaws.com/$accountId/returnflow-label-queue"
$refundQueueUrl = "https://sqs.$region.amazonaws.com/$accountId/returnflow-refund-queue"

Write-Host "  ✔ SQS Queues ready:" -ForegroundColor Green
Write-Host "    - Label Queue:  $labelQueueUrl" -ForegroundColor Gray
Write-Host "    - Refund Queue: $refundQueueUrl" -ForegroundColor Gray

# ------------------------------------------------------------------------------
# STEP 4: SNS Topic
# ------------------------------------------------------------------------------
Write-Host "`n[5/6] Setting up SNS Notification Topic..." -ForegroundColor Yellow
$snsTopicArn = (aws sns create-topic --name returnflow-notifications --region $region --output text).Split()[-1]
Write-Host "  ✔ SNS Topic Created: $snsTopicArn" -ForegroundColor Green

$notifEmail = Read-Host "Enter notification email address to subscribe (or press Enter to skip)"
if (-not [string]::IsNullOrWhiteSpace($notifEmail)) {
    aws sns subscribe --topic-arn $snsTopicArn --protocol email --notification-endpoint $notifEmail --region $region | Out-Null
    Write-Host "  ➔ Confirmation email sent to $notifEmail. Check your inbox and click 'Confirm subscription'!" -ForegroundColor Yellow
}

# ------------------------------------------------------------------------------
# STEP 5: ECR Repositories
# ------------------------------------------------------------------------------
Write-Host "`n[6/6] Setting up ECR Repositories..." -ForegroundColor Yellow
aws ecr create-repository --repository-name returnflow-backend --region $region 2>$null | Out-Null
aws ecr create-repository --repository-name returnflow-frontend --region $region 2>$null | Out-Null
Write-Host "  ✔ ECR Repositories created:" -ForegroundColor Green
Write-Host "    - $accountId.dkr.ecr.$region.amazonaws.com/returnflow-backend" -ForegroundColor Gray
Write-Host "    - $accountId.dkr.ecr.$region.amazonaws.com/returnflow-frontend" -ForegroundColor Gray

# ------------------------------------------------------------------------------
# SUMMARY & WIRING INSTRUCTIONS
# ------------------------------------------------------------------------------
Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "             AWS SETUP COMPLETED SUCCESSFULLY!                  " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green

Write-Host "`n1. Copy-paste these exact values into your backend/.env:" -ForegroundColor White
Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "AWS_REGION=$region"
Write-Host "S3_BUCKET_NAME=$bucketName"
Write-Host "SQS_LABEL_QUEUE_URL=$labelQueueUrl"
Write-Host "SQS_REFUND_QUEUE_URL=$refundQueueUrl"
Write-Host "SNS_TOPIC_ARN=$snsTopicArn"
Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan

if ($newKeyId) {
    Write-Host "`n2. Save these GitHub Repository Secrets (Settings -> Secrets -> Actions):" -ForegroundColor White
    Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "AWS_ACCESS_KEY_ID:     $newKeyId"
    Write-Host "AWS_SECRET_ACCESS_KEY: $newSecretKey"
    Write-Host "AWS_REGION:            $region"
    Write-Host "ECR_REPOSITORY_BACKEND: returnflow-backend"
    Write-Host "ECR_REPOSITORY_FRONTEND: returnflow-frontend"
    Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan
}

Write-Host "`nRun 'node scripts/smoke-test.js' to verify live AWS connectivity.`n" -ForegroundColor Yellow
