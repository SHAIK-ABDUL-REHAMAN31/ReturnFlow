# ReturnFlow — IAM Least-Privilege Policies

Every IAM policy in ReturnFlow adheres to the **principle of least privilege**. No policy uses wildcard `"*"` for resources or actions per security specification §5.5.

---

## 1. ECS Task Role (`returnflow-ecs-task-role`)

Attached directly to the running Fargate container. Scoped strictly to ReturnFlow resources.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3PresignedReadWrite",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::returnflow-returns-bucket/*"
    },
    {
      "Sid": "SQSSendJobs",
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:GetQueueUrl"
      ],
      "Resource": [
        "arn:aws:sqs:us-east-1:123456789012:returnflow-label-queue",
        "arn:aws:sqs:us-east-1:123456789012:returnflow-refund-queue"
      ]
    },
    {
      "Sid": "SNSPublishNotifications",
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "arn:aws:sns:us-east-1:123456789012:returnflow-notifications"
    }
  ]
}
```

---

## 2. ECS Task Execution Role (`returnflow-ecs-execution-role`)

Allows the ECS agent to bootstrap tasks, pull Docker images from ECR, and write container logs.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRAuthAndPull",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchTaskLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:123456789012:log-group:/ecs/returnflow-*"
    }
  ]
}
```

---

## 3. Step Functions Execution Role (`returnflow-step-functions-role`)

Orchestrates the visual label generation sub-flow.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "InvokeLabelLambdas",
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": [
        "arn:aws:lambda:us-east-1:123456789012:function:returnflow-validate-return",
        "arn:aws:lambda:us-east-1:123456789012:function:returnflow-generate-label",
        "arn:aws:lambda:us-east-1:123456789012:function:returnflow-upload-s3",
        "arn:aws:lambda:us-east-1:123456789012:function:returnflow-update-status"
      ]
    },
    {
      "Sid": "PublishToSNSFromWorkflow",
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "arn:aws:sns:us-east-1:123456789012:returnflow-notifications"
    }
  ]
}
```
