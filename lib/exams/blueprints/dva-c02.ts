import type { ExamBlueprint } from "../types"

export const dvaC02Blueprint: ExamBlueprint = {
  examCode: "DVA-C02",
  exam: "AWS Certified Developer – Associate",
  provider: "aws",
  questionCount: 65,
  durationMin: 130,
  passMark: 72,
  questionMix: { singleChoice: 0.7, multipleResponse: 0.3 },
  styleGuide: { scenarioHeavy: true, servicesShortNames: true },
  domains: [
    {
      id: "development",
      name: "Development with AWS Services",
      weightPercent: 32,
      topics: [
        "SDK usage and AWS API authentication",
        "Lambda development, triggers, and concurrency",
        "DynamoDB access patterns and indexes",
        "S3 object operations and event notifications",
        "SQS, SNS, and EventBridge integration",
        "Cognito user pools and identity pools",
      ],
    },
    {
      id: "security",
      name: "Security",
      weightPercent: 26,
      topics: [
        "IAM roles for Lambda and EC2",
        "KMS encryption for application data",
        "Secrets Manager and Parameter Store",
        "API Gateway authorization and throttling",
      ],
    },
    {
      id: "deployment",
      name: "Deployment",
      weightPercent: 24,
      topics: [
        "Elastic Beanstalk and CodeDeploy",
        "CI/CD with CodePipeline and CodeBuild",
        "CloudFormation and SAM basics",
        "Lambda versions, aliases, and traffic shifting",
        "Container deployment with ECS/EKS overview",
      ],
    },
    {
      id: "troubleshooting",
      name: "Troubleshooting and Optimization",
      weightPercent: 18,
      topics: [
        "CloudWatch Logs, metrics, and X-Ray tracing",
        "Debugging Lambda and API Gateway errors",
        "Performance tuning for DynamoDB and Lambda",
        "Cost optimization for serverless workloads",
      ],
    },
  ],
}
