#!/usr/bin/env bash
set -e

echo "=== ReturnFlow Environment Configuration Check ==="

REQUIRED_VARS=(
  "PORT"
  "MONGO_URI"
  "JWT_ACCESS_SECRET"
  "JWT_REFRESH_SECRET"
  "REDIS_URL"
  "AWS_REGION"
  "S3_BUCKET_NAME"
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

if [ $MISSING -eq 1 ]; then
  echo "❌ Validation failed: One or more required environment variables are missing."
  exit 1
else
  echo "🎉 Environment configuration validated successfully."
fi
