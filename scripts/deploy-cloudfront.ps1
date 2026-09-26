# ==============================================================================
# ReturnFlow - Deploy CloudFront Distribution for Frontend CDN
# ==============================================================================
$ErrorActionPreference = "Continue"
$env:AWS_PROFILE = "returnflow-new"
$REGION = "us-east-1"
$BUCKET = "returnflow-abdul-bucket"
$ACCOUNT_ID = "006635110818"

Write-Host "==> Checking Origin Access Control (OAC)..." -ForegroundColor Cyan
$oacList = aws cloudfront list-origin-access-controls --profile returnflow-new --output json | ConvertFrom-Json
$oacId = $null

if ($oacList.OriginAccessControlList.Items) {
    $existingOac = $oacList.OriginAccessControlList.Items | Where-Object { $_.Name -eq "returnflow-s3-oac" }
    if ($existingOac) {
        $oacId = $existingOac.Id
        Write-Host "Found existing OAC: $oacId" -ForegroundColor Green
    }
}

if (-not $oacId) {
    Write-Host "Creating new Origin Access Control..." -ForegroundColor Yellow
    $oacRes = aws cloudfront create-origin-access-control --origin-access-control-config "file://infra/cloudfront/oac-config.json" --profile returnflow-new --output json | ConvertFrom-Json
    $oacId = $oacRes.OriginAccessControl.Id
    Write-Host "Created OAC: $oacId" -ForegroundColor Green
}

# Check if distribution already exists
Write-Host "==> Checking existing CloudFront distributions..." -ForegroundColor Cyan
$distList = aws cloudfront list-distributions --profile returnflow-new --output json | ConvertFrom-Json
$distId = $null
$domainName = $null

if ($distList.DistributionList.Items) {
    $existingDist = $distList.DistributionList.Items | Where-Object { $_.Comment -like "*ReturnFlow*" }
    if ($existingDist) {
        $distId = $existingDist.Id
        $domainName = $existingDist.DomainName
        Write-Host "Found existing Distribution: $distId ($domainName)" -ForegroundColor Green
    }
}

if (-not $distId) {
    Write-Host "==> Generating CloudFront Distribution Config..." -ForegroundColor Cyan
    $callerRef = "returnflow-cf-" + (Get-Date -Format "yyyyMMdd-HHmmss")
    $distConfig = @"
{
  "CallerReference": "$callerRef",
  "Aliases": { "Quantity": 0 },
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-$BUCKET",
        "DomainName": "$BUCKET.s3.$REGION.amazonaws.com",
        "OriginPath": "",
        "CustomHeaders": { "Quantity": 0 },
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        },
        "OriginAccessControlId": "$oacId",
        "ConnectionAttempts": 3,
        "ConnectionTimeout": 10
      }
    ]
  },
  "OriginGroups": { "Quantity": 0 },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-$BUCKET",
    "TrustedSigners": { "Enabled": false, "Quantity": 0 },
    "TrustedKeyGroups": { "Enabled": false, "Quantity": 0 },
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "SmoothStreaming": false,
    "Compress": true,
    "LambdaFunctionAssociations": { "Quantity": 0 },
    "FunctionAssociations": { "Quantity": 0 },
    "FieldLevelEncryptionId": "",
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
  },
  "CacheBehaviors": { "Quantity": 0 },
  "CustomErrorResponses": { "Quantity": 0 },
  "Comment": "ReturnFlow Frontend Static CDN",
  "Logging": {
    "Enabled": false,
    "IncludeCookies": false,
    "Bucket": "",
    "Prefix": ""
  },
  "PriceClass": "PriceClass_100",
  "Enabled": true,
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true,
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "Restrictions": {
    "GeoRestriction": {
      "RestrictionType": "none",
      "Quantity": 0
    }
  },
  "HttpVersion": "http2and3",
  "IsIPV6Enabled": true,
  "ContinuousDeploymentPolicyId": "",
  "Staging": false
}
"@
    $distConfigPath = Join-Path (Get-Location) "infra/cloudfront/distribution-config.json"
    [System.IO.File]::WriteAllText($distConfigPath, $distConfig)

    Write-Host "==> Creating CloudFront Distribution in AWS..." -ForegroundColor Cyan
    $createDistRaw = aws cloudfront create-distribution --distribution-config "file://$distConfigPath" --profile returnflow-new --output json
    $createDistRes = $createDistRaw | ConvertFrom-Json
    $distId = $createDistRes.Distribution.Id
    $domainName = $createDistRes.Distribution.DomainName
    Write-Host "Created Distribution ID: $distId" -ForegroundColor Green
    Write-Host "Distribution Domain: $domainName" -ForegroundColor Green
}

# Update S3 Bucket Policy to allow CloudFront OAC access
Write-Host "==> Updating S3 Bucket Policy for CloudFront OAC..." -ForegroundColor Cyan
$bucketPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipalReadOnly",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::$ACCOUNT_ID:distribution/$distId"
        }
      }
    }
  ]
}
"@
$policyPath = Join-Path (Get-Location) "infra/cloudfront/s3-bucket-policy.json"
[System.IO.File]::WriteAllText($policyPath, $bucketPolicy)
aws s3api put-bucket-policy --bucket $BUCKET --policy "file://$policyPath" --profile returnflow-new

# Upload a demo index.html and health status asset to S3
Write-Host "==> Uploading test/demo static asset to S3..." -ForegroundColor Cyan
$demoHtml = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ReturnFlow CDN - Active</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 2rem 3rem; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    h1 { color: #38bdf8; margin-bottom: 0.5rem; }
    p { color: #94a3b8; font-size: 1.1rem; }
    .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; background: #065f46; color: #34d399; font-weight: 600; font-size: 0.875rem; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>ReturnFlow Edge CDN</h1>
    <p>Amazon CloudFront + S3 Static Distribution</p>
    <div class="badge">AWS CloudFront HTTPS Active</div>
  </div>
</body>
</html>
"@
$htmlPath = Join-Path (Get-Location) "infra/cloudfront/index.html"
[System.IO.File]::WriteAllText($htmlPath, $demoHtml)

aws s3 cp "infra/cloudfront/index.html" "s3://$BUCKET/index.html" --content-type "text/html" --profile returnflow-new

# Save info file
$info = @{
    distributionId = $distId
    domainName = $domainName
    bucket = $BUCKET
    status = "Deployed"
    deployedAt = (Get-Date).ToString("o")
} | ConvertTo-Json -Depth 5
$infoPath = Join-Path (Get-Location) "infra/cloudfront/distribution-info.json"
[System.IO.File]::WriteAllText($infoPath, $info)

Write-Host "=================================================================" -ForegroundColor Green
Write-Host "CloudFront CDN Successfully Deployed!" -ForegroundColor Green
Write-Host "Distribution ID: $distId" -ForegroundColor Cyan
Write-Host "Domain Name:     https://$domainName" -ForegroundColor Cyan
Write-Host "S3 Origin:       $BUCKET" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Green
