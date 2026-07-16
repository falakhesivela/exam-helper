import type { ExamBlueprint } from "../types"

export const soaC03Blueprint: ExamBlueprint = {
  examCode: "SOA-C03",
  exam: "AWS Certified CloudOps Engineer – Associate",
  provider: "aws",
  questionCount: 65,
  durationMin: 130,
  passMark: 72,
  questionMix: { singleChoice: 0.7, multipleResponse: 0.3 },
  styleGuide: { scenarioHeavy: true, servicesShortNames: true },
  domains: [
    {
      id: "monitoring-logging-remediation",
      name: "Monitoring, Logging, Analysis, Remediation, and Performance Optimization",
      weightPercent: 22,
      topics: [
        "CloudWatch metrics, alarms, composite alarms, and cross-account dashboards",
        "CloudWatch agent configuration for EC2, ECS, and EKS workloads",
        "Event-driven remediation with EventBridge, Lambda, and Systems Manager runbooks",
        "EBS and S3 performance tuning: volume types, Transfer Acceleration, multipart uploads",
        "RDS performance: Performance Insights, RDS Proxy, configuration tuning",
        "Notifications with SNS and alarm-invoked actions",
      ],
    },
    {
      id: "reliability-business-continuity",
      name: "Reliability and Business Continuity",
      weightPercent: 22,
      topics: [
        "Auto Scaling and elasticity for compute environments",
        "Caching with CloudFront and ElastiCache to absorb dynamic load",
        "ELB and Route 53 health checks, Multi-AZ fault-tolerant deployments",
        "Scaling managed databases: RDS read replicas, DynamoDB capacity modes",
        "Automated backups and snapshots with AWS Backup; point-in-time restore",
        "Disaster recovery patterns: backup/restore, pilot light, warm standby, active/active; RTO/RPO",
      ],
    },
    {
      id: "deployment-provisioning-automation",
      name: "Deployment, Provisioning, and Automation",
      weightPercent: 22,
      topics: [
        "AMI and container image pipelines with EC2 Image Builder",
        "CloudFormation and CDK resource management; troubleshooting stack errors",
        "Cross-account and cross-Region provisioning: StackSets, AWS RAM",
        "Deployment strategies and third-party IaC tooling (Terraform, Git workflows)",
        "Operational automation with Systems Manager",
        "Event-driven automation: Lambda, S3 Event Notifications, EventBridge",
      ],
    },
    {
      id: "security-compliance",
      name: "Security and Compliance",
      weightPercent: 16,
      topics: [
        "IAM features: password policies, MFA, roles, federation, resource policies",
        "Auditing access with CloudTrail, IAM Access Analyzer, and policy simulator",
        "Multi-account security: Organizations, SCPs, IAM Identity Center",
        "Compliance monitoring: AWS Config conformance packs, Trusted Advisor checks",
        "Data protection: KMS encryption at rest, ACM for transit, secrets storage",
        "Findings triage with Security Hub, GuardDuty, and Inspector",
      ],
    },
    {
      id: "networking-content-delivery",
      name: "Networking and Content Delivery",
      weightPercent: 18,
      topics: [
        "VPC building blocks: subnets, route tables, NACLs, security groups, NAT and internet gateways",
        "Private connectivity: VPC endpoints, PrivateLink, VPC peering",
        "DNS with Route 53: routing policies, Resolver, query logging",
        "Content delivery with CloudFront and Global Accelerator; caching issues",
        "Troubleshooting connectivity with VPC flow logs, ELB access logs, and WAF logs",
        "Hybrid connectivity troubleshooting and network cost optimization",
      ],
    },
  ],
}
