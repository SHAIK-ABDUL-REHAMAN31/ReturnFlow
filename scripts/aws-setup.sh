#!/usr/bin/env bash
# ==============================================================================
# ReturnFlow — Automated AWS Free-Tier Infrastructure Provisioner
# Provisions: IAM CI/CD user, S3 bucket with CORS, SQS queues + DLQs, SNS topic, ECR repos
# ==============================================================================

set -e

echo -e "\033[1;36m================================================================\033[0m"
echo -e "\033[1;36m       ReturnFlow Automated AWS Setup & Connection Script       \033[0m"
echo -e "\033[1;36m================================================================\033[0m"

# 1. Check prerequisites
if ! command -v aws &> /dev/null; then
    echo -e "\033[1;31m[ERROR] AWS CLI is not installed or not in PATH.\033[0m"
    echo "Install it from: https://aws.amazon.com/cli/ and run 'aws configure'."
    exit 1
fi

echo -e "\n\033[1;34m[1/6] Verifying AWS CLI authentication...\033[0m"
CALLER_IDENTITY=$(aws sts get-caller-identity --output json 2>/dev/null || true)

if [ -z "$CALLER_IDENTITY" ]; then
    echo -e "\033[1;31m[ERROR] Unable to authenticate with AWS. Please run 'aws configure'.\033[0m"
    exit 1
fi

ACCOUNT_ID=$(echo "$CALLER_IDENTITY" | grep -o '"Account": "[^"]*' | cut -d'"' -f4)
CURRENT_ARN=$(echo "$CALLER_IDENTITY" | grep -o '"Arn": "[^"]*' | cut -d'"' -f4)
REGION=${AWS_REGION:-"us-east-1"}

echo -e "  \033[32m✔ Authenticated as:\033[0m $CURRENT_ARN"
echo -e "  \033[32m✔ AWS Account ID:\033[0m $ACCOUNT_ID"
echo -e "  \033[32m✔ Target Region:\033[0m $REGION"

# Unique identifier for S3 bucket name
DEFAULT_SUFFIX=$(echo "$ACCOUNT_ID" | tail -c 5)
read -p "Enter a unique suffix for your S3 bucket [default: $DEFAULT_SUFFIX]: " BUCKET_SUFFIX
BUCKET_SUFFIX=${BUCKET_SUFFIX:-$DEFAULT_SUFFIX}
BUCKET_NAME="returnflow-${BUCKET_SUFFIX}-bucket"

# ------------------------------------------------------------------------------
# STEP 1: IAM User for CI/CD
# ------------------------------------------------------------------------------
echo -e "\n\033[1;34m[2/6] Setting up IAM CI/CD User (returnflow-ci-cd)...\033[0m"
if aws iam get-user --user-name returnflow-ci-cd &>/dev/null; then
    echo "  IAM user 'returnflow-ci-cd' already exists."
else
    aws iam create-user --user-name returnflow-ci-cd >/dev/null
    echo "  Created IAM user 'returnflow-ci-cd'."
fi

aws iam attach-user-policy --user-name returnflow-ci-cd \
    --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser
aws iam attach-user-policy --user-name returnflow-ci-cd \
    --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess
echo -e "  \033[32m✔ Attached ECR & ECS deployment policies.\033[0m"

echo "  Creating new access keys for CI/CD..."
ACCESS_KEY_JSON=$(aws iam create-access-key --user-name returnflow-ci-cd --output json 2>/dev/null || echo "")

if [ -n "$ACCESS_KEY_JSON" ]; then
    NEW_KEY_ID=$(echo "$ACCESS_KEY_JSON" | grep -o '"AccessKeyId": "[^"]*' | cut -d'"' -f4)
    NEW_SECRET_KEY=$(echo "$ACCESS_KEY_JSON" | grep -o '"SecretAccessKey": "[^"]*' | cut -d'"' -f4)
else
    echo "  (Access key limit reached or key already exists; use your existing IAM key)"
fi

# ------------------------------------------------------------------------------
# STEP 2: S3 Bucket with Block Public Access + CORS
# ------------------------------------------------------------------------------
echo -e "\n\033[1;34m[3/6] Setting up S3 Bucket ($BUCKET_NAME)...\033[0m"
if [ "$REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION" >/dev/null 2>&1 || true
else
    aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION" \
        --create-bucket-configuration LocationConstraint="$REGION" >/dev/null 2>&1 || true
fi

aws s3api put-public-access-block --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

CORS_CONFIG='{
  "CORSRules": [{
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": ["http://localhost:3000", "https://*.cloudfront.net"],
    "ExposeHeaders": ["ETag"]
  }]
}'
aws s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration "$CORS_CONFIG"
echo -e "  \033[32m✔ S3 bucket '$BUCKET_NAME' configured with private ACL and CORS.\033[0m"

# ------------------------------------------------------------------------------
# STEP 3: SQS Queues + Dead Letter Queues (DLQs)
# ------------------------------------------------------------------------------
echo -e "\n\033[1;34m[4/6] Setting up SQS Queues & DLQs with redrive policy (maxReceiveCount=3)...\033[0m"
aws sqs create-queue --queue-name returnflow-label-dlq --region "$REGION" >/dev/null 2>&1 || true
aws sqs create-queue --queue-name returnflow-refund-dlq --region "$REGION" >/dev/null 2>&1 || true

LABEL_DLQ_ARN=$(aws sqs get-queue-attributes --queue-url "https://sqs.${REGION}.amazonaws.com/${ACCOUNT_ID}/returnflow-label-dlq" --attribute-names QueueArn --region "$REGION" --output text | awk '{print $NF}')
REFUND_DLQ_ARN=$(aws sqs get-queue-attributes --queue-url "https://sqs.${REGION}.amazonaws.com/${ACCOUNT_ID}/returnflow-refund-dlq" --attribute-names QueueArn --region "$REGION" --output text | awk '{print $NF}')

LABEL_ATTRS="{\"RedrivePolicy\": \"{\\\"deadLetterTargetArn\\\":\\\"${LABEL_DLQ_ARN}\\\",\\\"maxReceiveCount\\\":\\\"3\\\"}\"}"
REFUND_ATTRS="{\"RedrivePolicy\": \"{\\\"deadLetterTargetArn\\\":\\\"${REFUND_DLQ_ARN}\\\",\\\"maxReceiveCount\\\":\\\"3\\\"}\"}"

aws sqs create-queue --queue-name returnflow-label-queue --attributes "$LABEL_ATTRS" --region "$REGION" >/dev/null 2>&1 || true
aws sqs create-queue --queue-name returnflow-refund-queue --attributes "$REFUND_ATTRS" --region "$REGION" >/dev/null 2>&1 || true

LABEL_QUEUE_URL="https://sqs.${REGION}.amazonaws.com/${ACCOUNT_ID}/returnflow-label-queue"
REFUND_QUEUE_URL="https://sqs.${REGION}.amazonaws.com/${ACCOUNT_ID}/returnflow-refund-queue"
echo -e "  \033[32m✔ SQS Queues ready:\033[0m"
echo "    - Label Queue:  $LABEL_QUEUE_URL"
echo "    - Refund Queue: $REFUND_QUEUE_URL"

# ------------------------------------------------------------------------------
# STEP 4: SNS Topic
# ------------------------------------------------------------------------------
echo -e "\n\033[1;34m[5/6] Setting up SNS Notification Topic...\033[0m"
SNS_TOPIC_ARN=$(aws sns create-topic --name returnflow-notifications --region "$REGION" --output text | awk '{print $NF}')
echo -e "  \033[32m✔ SNS Topic Created:\033[0m $SNS_TOPIC_ARN"

read -p "Enter notification email address to subscribe (or press Enter to skip): " NOTIF_EMAIL
if [ -n "$NOTIF_EMAIL" ]; then
    aws sns subscribe --topic-arn "$SNS_TOPIC_ARN" --protocol email --notification-endpoint "$NOTIF_EMAIL" --region "$REGION" >/dev/null
    echo -e "  \033[33m➔ Subscription sent to $NOTIF_EMAIL. Check your inbox and click 'Confirm subscription'!\033[0m"
fi

# ------------------------------------------------------------------------------
# STEP 5: ECR Repositories
# ------------------------------------------------------------------------------
echo -e "\n\033[1;34m[6/6] Setting up ECR Repositories...\033[0m"
aws ecr create-repository --repository-name returnflow-backend --region "$REGION" >/dev/null 2>&1 || true
aws ecr create-repository --repository-name returnflow-frontend --region "$REGION" >/dev/null 2>&1 || true
echo -e "  \033[32m✔ ECR Repositories created:\033[0m"
echo "    - ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/returnflow-backend"
echo "    - ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/returnflow-frontend"

# ------------------------------------------------------------------------------
# SUMMARY & WIRING INSTRUCTIONS
# ------------------------------------------------------------------------------
echo -e "\n\033[1;32m================================================================\033[0m"
echo -e "\033[1;32m             AWS SETUP COMPLETED SUCCESSFULLY!                  \033[0m"
echo -e "\033[1;32m================================================================\033[0m"

echo -e "\n\033[1m1. Update your backend/.env with these exact lines:\033[0m"
echo "----------------------------------------------------------------"
echo "AWS_REGION=${REGION}"
echo "S3_BUCKET_NAME=${BUCKET_NAME}"
echo "SQS_LABEL_QUEUE_URL=${LABEL_QUEUE_URL}"
echo "SQS_REFUND_QUEUE_URL=${REFUND_QUEUE_URL}"
echo "SNS_TOPIC_ARN=${SNS_TOPIC_ARN}"
echo "----------------------------------------------------------------"

if [ -n "$NEW_KEY_ID" ]; then
    echo -e "\n\033[1m2. Save these GitHub Repository Secrets (Settings -> Secrets -> Actions):\033[0m"
    echo "----------------------------------------------------------------"
    echo "AWS_ACCESS_KEY_ID:     $NEW_KEY_ID"
    echo "AWS_SECRET_ACCESS_KEY: $NEW_SECRET_KEY"
    echo "AWS_REGION:            $REGION"
    echo "ECR_REPOSITORY_BACKEND: returnflow-backend"
    echo "ECR_REPOSITORY_FRONTEND: returnflow-frontend"
    echo "----------------------------------------------------------------"
fi

echo -e "\nRun \033[36mnode scripts/smoke-test.js\033[0m to verify live AWS connectivity.\n"
