# ==============================================================================
# ReturnFlow - Automated ECS Fargate & ALB Deployment Script
# ==============================================================================
$ErrorActionPreference = "Stop"

$env:AWS_PROFILE = "returnflow-new"
$REGION = "us-east-1"
$ACCOUNT_ID = "006635110818"
$CLUSTER_NAME = "returnflow-cluster"
$SERVICE_NAME = "returnflow-backend-service"
$TASK_FAMILY = "returnflow-backend-task"
$VPC_ID = "vpc-072042bec5dbf0c59"
$SUBNET_1 = "subnet-0e8619211dee8563e"
$SUBNET_2 = "subnet-0f607af01b45bb7b9"
$ALB_SG = "sg-0ba181947663a1178"
$ECS_SG = "sg-08c537c5ef9cec15d"
$TG_ARN = "arn:aws:elasticloadbalancing:us-east-1:006635110818:targetgroup/returnflow-backend-tg/ddb4badf4404ee2c"
$ECR_REPO = "006635110818.dkr.ecr.us-east-1.amazonaws.com/returnflow-backend"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " ReturnFlow Backend ECS/Fargate Deployment" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verify Caller Identity
Write-Host "`n[1/8] Verifying AWS Identity..." -ForegroundColor Yellow
$caller = aws sts get-caller-identity --output json | ConvertFrom-Json
Write-Host "  ✔ Logged in as: $($caller.Arn)" -ForegroundColor Green

# 2. Service-Linked Role for ELB
Write-Host "`n[2/8] Ensuring Elastic Load Balancing Service Role..." -ForegroundColor Yellow
try {
    aws iam create-service-linked-role --aws-service-name elasticloadbalancing.amazonaws.com 2>$null
    Write-Host "  ✔ Created service-linked role for ELB" -ForegroundColor Green
} catch {
    Write-Host "  ✔ Service-linked role for ELB already present or managed" -ForegroundColor Gray
}

# 3. Create IAM Roles for ECS Tasks
Write-Host "`n[3/8] Ensuring ECS Task & Execution Roles..." -ForegroundColor Yellow
$trustPolicy = '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}'

try {
    aws iam get-role --role-name returnflow-ecs-execution-role 2>$null
    Write-Host "  ✔ returnflow-ecs-execution-role exists" -ForegroundColor Gray
} catch {
    aws iam create-role --role-name returnflow-ecs-execution-role --assume-role-policy-document $trustPolicy | Out-Null
    aws iam attach-role-policy --role-name returnflow-ecs-execution-role --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    Write-Host "  ✔ Created returnflow-ecs-execution-role" -ForegroundColor Green
}

try {
    aws iam get-role --role-name returnflow-ecs-task-role 2>$null
    Write-Host "  ✔ returnflow-ecs-task-role exists" -ForegroundColor Gray
} catch {
    aws iam create-role --role-name returnflow-ecs-task-role --assume-role-policy-document $trustPolicy | Out-Null
    $taskPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::returnflow-abdul-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": ["sqs:SendMessage", "sqs:GetQueueUrl"],
      "Resource": [
        "arn:aws:sqs:us-east-1:006635110818:returnflow-label-queue",
        "arn:aws:sqs:us-east-1:006635110818:returnflow-refund-queue"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["sns:Publish"],
      "Resource": "arn:aws:sns:us-east-1:006635110818:returnflow-notifications"
    }
  ]
}
"@
    aws iam put-role-policy --role-name returnflow-ecs-task-role --policy-name returnflow-task-least-privilege --policy-document $taskPolicy
    Write-Host "  ✔ Created returnflow-ecs-task-role" -ForegroundColor Green
}

# 4. ALB Creation
Write-Host "`n[4/8] Ensuring Application Load Balancer..." -ForegroundColor Yellow
$albs = aws elbv2 describe-load-balancers --names returnflow-alb 2>$null | ConvertFrom-Json
$albArn = $null
$albDns = $null
if ($albs.LoadBalancers.Count -gt 0) {
    $albArn = $albs.LoadBalancers[0].LoadBalancerArn
    $albDns = $albs.LoadBalancers[0].DNSName
    Write-Host "  ✔ ALB already exists: $albDns" -ForegroundColor Green
} else {
    $albObj = aws elbv2 create-load-balancer --name returnflow-alb --subnets $SUBNET_1 $SUBNET_2 --security-groups $ALB_SG --scheme internet-facing --type application --output json | ConvertFrom-Json
    $albArn = $albObj.LoadBalancers[0].LoadBalancerArn
    $albDns = $albObj.LoadBalancers[0].DNSName
    Write-Host "  ✔ Created ALB: $albDns" -ForegroundColor Green
}

# Create Listener on port 80 forwarding to Target Group
$listeners = aws elbv2 describe-listeners --load-balancer-arn $albArn 2>$null | ConvertFrom-Json
if ($listeners.Listeners.Count -eq 0) {
    aws elbv2 create-listener --load-balancer-arn $albArn --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn=$TG_ARN | Out-Null
    Write-Host "  ✔ Created port 80 HTTP listener routing to target group" -ForegroundColor Green
} else {
    Write-Host "  ✔ Listener already active on port 80" -ForegroundColor Gray
}

# 5. Build and Push Docker image to ECR
Write-Host "`n[5/8] Building & Pushing Docker Image to ECR..." -ForegroundColor Yellow
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
docker build -t "$ECR_REPO`:latest" ./backend
docker push "$ECR_REPO`:latest"
Write-Host "  ✔ Image pushed to ECR: $ECR_REPO:latest" -ForegroundColor Green

# 6. Register Task Definition
Write-Host "`n[6/8] Registering ECS Task Definition..." -ForegroundColor Yellow
$taskDefContent = Get-Content 'infra/ecs/task-definition.json' -Raw
if (Test-Path 'backend/.env') {
    $envContent = Get-Content 'backend/.env' -Raw
    if ($envContent -match 'MONGO_URI=(.+)') {
        $realMongo = $matches[1].Trim()
        $taskDefContent = $taskDefContent.Replace('mongodb+srv://<DB_USER>:<DB_PASSWORD>@returnflow.fl4tbwp.mongodb.net/returnflow?retryWrites=true&w=majority&appName=ReturnFlow', $realMongo)
    }
}
$tempTaskDef = [System.IO.Path]::GetTempFileName() + '.json'
[System.IO.File]::WriteAllText($tempTaskDef, $taskDefContent)
aws ecs register-task-definition --cli-input-json "file://$tempTaskDef" | Out-Null
Remove-Item $tempTaskDef -ErrorAction SilentlyContinue
Write-Host "  ✔ Registered task definition: $TASK_FAMILY" -ForegroundColor Green

# 7. Create or Update ECS Service
Write-Host "`n[7/8] Deploying to ECS/Fargate Service..." -ForegroundColor Yellow
$services = aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --output json 2>$null | ConvertFrom-Json
$svcActive = $false
if ($services.services.Count -gt 0 -and $services.services[0].status -eq "ACTIVE") {
    $svcActive = $true
}

if ($svcActive) {
    Write-Host "  Updating existing service..." -ForegroundColor Gray
    aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --task-definition $TASK_FAMILY --force-new-deployment | Out-Null
} else {
    Write-Host "  Creating new Fargate service..." -ForegroundColor Gray
    aws ecs create-service `
        --cluster $CLUSTER_NAME `
        --service-name $SERVICE_NAME `
        --task-definition $TASK_FAMILY `
        --desired-count 1 `
        --launch-type FARGATE `
        --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],securityGroups=[$ECS_SG],assignPublicIp=ENABLED}" `
        --load-balancers "targetGroupArn=$TG_ARN,containerName=returnflow-backend,containerPort=4000" | Out-Null
}
Write-Host "  ✔ ECS Fargate service deployed!" -ForegroundColor Green

# 8. Service Health Check Verification
Write-Host "`n[8/8] Polling ALB Healthcheck at http://$albDns/health ..." -ForegroundColor Yellow
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$healthy = $false
while ($sw.Elapsed.TotalMinutes -lt 5) {
    try {
        $res = Invoke-RestMethod -Uri "http://$albDns/health" -TimeoutSec 5 -ErrorAction Stop
        if ($res.status -eq "OK" -or $res.status -eq "healthy" -or $res) {
            $healthy = $true
            break
        }
    } catch {
        Write-Host "  Waiting for container bootstrap & target group registration... ($([int]$sw.Elapsed.TotalSeconds)s)" -ForegroundColor Gray
        Start-Sleep -Seconds 15
    }
}

if ($healthy) {
    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host " 🎉 SUCCESS: ReturnFlow Backend is LIVE on AWS ECS/Fargate!" -ForegroundColor Green
    Write-Host " ALB URL: http://$albDns" -ForegroundColor Cyan
    Write-Host " Health:  http://$albDns/health" -ForegroundColor Cyan
    Write-Host " API:     http://$albDns/api" -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Green
} else {
    Write-Host "`nService is still starting. Check status in ECS console or query:" -ForegroundColor Yellow
    Write-Host "  aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME" -ForegroundColor Gray
    Write-Host "ALB URL: http://$albDns/health" -ForegroundColor Cyan
}
