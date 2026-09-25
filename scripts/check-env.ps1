Write-Host "=== ReturnFlow Environment Configuration Check ===" -ForegroundColor Cyan

$requiredVars = @(
  "PORT",
  "MONGO_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "REDIS_URL",
  "AWS_REGION",
  "S3_BUCKET_NAME"
)

$envFile = "backend/.env"

if (-not (Test-Path $envFile)) {
  Write-Host "❌ Error: $envFile does not exist. Please copy from .env.example" -ForegroundColor Red
  exit 1
}

Write-Host "✅ Environment file $envFile found." -ForegroundColor Green

$envContent = Get-Content $envFile
$missing = 0

foreach ($var in $requiredVars) {
  $found = $envContent | Where-Object { $_ -match "^$var=" }
  if (-not $found) {
    Write-Host "❌ Missing required configuration: $var" -ForegroundColor Red
    $missing = 1
  } else {
    Write-Host "  ✓ $var configured" -ForegroundColor Gray
  }
}

if ($missing -eq 1) {
  Write-Host "❌ Validation failed: One or more required environment variables are missing." -ForegroundColor Red
  exit 1
} else {
  Write-Host "🎉 Environment configuration validated successfully." -ForegroundColor Green
}
