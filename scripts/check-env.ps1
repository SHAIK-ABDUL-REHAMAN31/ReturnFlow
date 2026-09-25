Write-Host "=== ReturnFlow Environment Configuration Check (§8) ===" -ForegroundColor Cyan

$requiredVars = @(
  "PORT",
  "MONGO_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "REDIS_URL",
  "AWS_REGION",
  "S3_BUCKET_NAME",
  "SQS_LABEL_QUEUE_URL",
  "SQS_REFUND_QUEUE_URL",
  "SNS_TOPIC_ARN",
  "OPENSEARCH_ENDPOINT",
  "STEP_FUNCTIONS_LABEL_ARN",
  "FRONTEND_URL"
)

$envFile = "backend/.env"

if (-not (Test-Path $envFile)) {
  Write-Host "[ERROR] $envFile does not exist. Please copy from .env.example" -ForegroundColor Red
  exit 1
}

Write-Host "[OK] Environment file $envFile found." -ForegroundColor Green

$envContent = Get-Content $envFile
$missing = 0

foreach ($var in $requiredVars) {
  $line = $envContent | Where-Object { $_ -match "^$var=" }
  if (-not $line) {
    Write-Host "[MISSING] Required configuration: $var" -ForegroundColor Red
    $missing = 1
  } else {
    Write-Host "  [OK] $var configured" -ForegroundColor Gray
  }
}

# Validate JWT secret length (minimum 32 characters per §5.1 & §5.3)
$accessSecretLine = $envContent | Where-Object { $_ -match "^JWT_ACCESS_SECRET=" }
$refreshSecretLine = $envContent | Where-Object { $_ -match "^JWT_REFRESH_SECRET=" }

if ($accessSecretLine) {
  $accessSecret = $accessSecretLine.Split("=", 2)[1].Trim()
  if ($accessSecret.Length -lt 32) {
    Write-Host "[SECURITY VIOLATION] JWT_ACCESS_SECRET must be at least 32 characters long." -ForegroundColor Red
    $missing = 1
  } else {
    Write-Host "  [OK] JWT_ACCESS_SECRET meets minimum 32-character entropy requirement." -ForegroundColor Green
  }
}

if ($refreshSecretLine) {
  $refreshSecret = $refreshSecretLine.Split("=", 2)[1].Trim()
  if ($refreshSecret.Length -lt 32) {
    Write-Host "[SECURITY VIOLATION] JWT_REFRESH_SECRET must be at least 32 characters long." -ForegroundColor Red
    $missing = 1
  } else {
    Write-Host "  [OK] JWT_REFRESH_SECRET meets minimum 32-character entropy requirement." -ForegroundColor Green
  }
}

if ($missing -eq 1) {
  Write-Host "[FAILED] Validation failed: One or more required environment variables are invalid or missing." -ForegroundColor Red
  exit 1
} else {
  Write-Host "[SUCCESS] Environment configuration validated successfully. Ready for deployment." -ForegroundColor Green
}
