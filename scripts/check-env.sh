#!/usr/bin/env bash
set -e

echo "=== ReturnFlow Environment Configuration Check (§8) ==="

REQUIRED_VARS=(
  "PORT"
  "MONGO_URI"
  "JWT_ACCESS_SECRET"
  "JWT_REFRESH_SECRET"
  "REDIS_URL"
  "AWS_REGION"
  "S3_BUCKET_NAME"
  "SQS_LABEL_QUEUE_URL"
  "SQS_REFUND_QUEUE_URL"
  "SNS_TOPIC_ARN"
  "OPENSEARCH_ENDPOINT"
  "STEP_FUNCTIONS_LABEL_ARN"
  "FRONTEND_URL"
)

ENV_FILE="backend/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: $ENV_FILE does not exist. Please copy from .env.example"
  exit 1
fi

echo "✅ Environment file $ENV_FILE found."

MISSING=0
for VAR in "${REQUIRED_VARS[@]}"; do
  if ! grep -q "^$VAR=" "$ENV_FILE"; then
    echo "❌ Missing required configuration: $VAR"
    MISSING=1
  else
    echo "  ✓ $VAR configured"
  fi
done

# Validate JWT secret length (minimum 32 characters per §5.1 & §5.3)
ACCESS_SECRET=$(grep "^JWT_ACCESS_SECRET=" "$ENV_FILE" | cut -d'=' -f2-)
REFRESH_SECRET=$(grep "^JWT_REFRESH_SECRET=" "$ENV_FILE" | cut -d'=' -f2-)

if [ ${#ACCESS_SECRET} -lt 32 ]; then
  echo "❌ Security Guardrail Violation: JWT_ACCESS_SECRET must be at least 32 characters long."
  MISSING=1
else
  echo "  ✓ JWT_ACCESS_SECRET meets minimum 32-character entropy requirement."
fi

if [ ${#REFRESH_SECRET} -lt 32 ]; then
  echo "❌ Security Guardrail Violation: JWT_REFRESH_SECRET must be at least 32 characters long."
  MISSING=1
else
  echo "  ✓ JWT_REFRESH_SECRET meets minimum 32-character entropy requirement."
fi

if [ $MISSING -eq 1 ]; then
  echo "❌ Validation failed: One or more required environment variables are invalid or missing."
  exit 1
else
  echo "🎉 Environment configuration validated successfully. Ready for deployment."
fi
