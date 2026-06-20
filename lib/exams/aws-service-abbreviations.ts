/** Common AWS service abbreviations shown during SAA/DVA mock exams. */
export const AWS_SERVICE_ABBREVIATIONS: { abbr: string; name: string }[] = [
  { abbr: "ACM", name: "AWS Certificate Manager" },
  { abbr: "ALB", name: "Application Load Balancer" },
  { abbr: "API GW", name: "Amazon API Gateway" },
  { abbr: "ASG", name: "Auto Scaling group" },
  { abbr: "AZ", name: "Availability Zone" },
  { abbr: "CloudFront", name: "Amazon CloudFront" },
  { abbr: "CloudTrail", name: "AWS CloudTrail" },
  { abbr: "CloudWatch", name: "Amazon CloudWatch" },
  { abbr: "Cognito", name: "Amazon Cognito" },
  { abbr: "DMS", name: "AWS Database Migration Service" },
  { abbr: "DynamoDB", name: "Amazon DynamoDB" },
  { abbr: "EBS", name: "Amazon Elastic Block Store" },
  { abbr: "EC2", name: "Amazon Elastic Compute Cloud" },
  { abbr: "ECR", name: "Amazon Elastic Container Registry" },
  { abbr: "ECS", name: "Amazon Elastic Container Service" },
  { abbr: "EFS", name: "Amazon Elastic File System" },
  { abbr: "EKS", name: "Amazon Elastic Kubernetes Service" },
  { abbr: "ELB", name: "Elastic Load Balancing" },
  { abbr: "EMR", name: "Amazon EMR" },
  { abbr: "EventBridge", name: "Amazon EventBridge" },
  { abbr: "Glue", name: "AWS Glue" },
  { abbr: "IAM", name: "AWS Identity and Access Management" },
  { abbr: "KMS", name: "AWS Key Management Service" },
  { abbr: "Kinesis", name: "Amazon Kinesis" },
  { abbr: "Lambda", name: "AWS Lambda" },
  { abbr: "NLB", name: "Network Load Balancer" },
  { abbr: "RDS", name: "Amazon Relational Database Service" },
  { abbr: "Route 53", name: "Amazon Route 53" },
  { abbr: "S3", name: "Amazon Simple Storage Service" },
  { abbr: "SNS", name: "Amazon Simple Notification Service" },
  { abbr: "SQS", name: "Amazon Simple Queue Service" },
  { abbr: "SSM", name: "AWS Systems Manager" },
  { abbr: "STS", name: "AWS Security Token Service" },
  { abbr: "VPC", name: "Amazon Virtual Private Cloud" },
  { abbr: "VPN", name: "AWS Site-to-Site VPN" },
  { abbr: "WAF", name: "AWS WAF" },
]

export function examShowsAwsServiceHelp(examCode: string): boolean {
  const code = examCode.toUpperCase()
  return code === "SAA-C03" || code === "DVA-C02"
}
