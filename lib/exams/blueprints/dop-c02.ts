import type { ExamBlueprint } from "../types"

export const dopC02Blueprint: ExamBlueprint = {
  examCode: "DOP-C02",
  exam: "AWS Certified DevOps Engineer – Professional",
  provider: "aws",
  questionCount: 75,
  durationMin: 180,
  passMark: 75,
  questionMix: { singleChoice: 0.65, multipleResponse: 0.35 },
  styleGuide: { scenarioHeavy: true, servicesShortNames: true },
  domains: [
    {
      id: "sdlc-automation",
      name: "SDLC Automation",
      weightPercent: 22,
      topics: [
        "CI/CD pipelines with CodePipeline, CodeBuild, and CodeDeploy",
        "Deployment strategies: blue/green, canary, rolling, all-at-once",
        "Automated testing gates and approval actions in pipelines",
        "Artifact management: CodeArtifact, ECR, S3 versioned artifacts",
        "Pipeline integration with EventBridge and cross-account deployments",
      ],
    },
    {
      id: "config-management-iac",
      name: "Configuration Management and IaC",
      weightPercent: 17,
      topics: [
        "CloudFormation at scale: StackSets, nested stacks, custom resources, drift",
        "CDK and SAM for application-defined infrastructure",
        "Multi-account strategy: Organizations, Control Tower, account factories",
        "Systems Manager: State Manager, Parameter Store, Automation documents",
        "OpsWorks and configuration drift remediation",
      ],
    },
    {
      id: "resilient-cloud-solutions",
      name: "Resilient Cloud Solutions",
      weightPercent: 15,
      topics: [
        "Multi-region and multi-AZ architectures for high availability",
        "Disaster recovery: backup/restore, pilot light, warm standby, active-active",
        "Auto Scaling policies, health checks, and self-healing patterns",
        "RTO/RPO analysis and failover automation with Route 53",
        "Data replication: S3 CRR, Aurora Global Database, DynamoDB global tables",
      ],
    },
    {
      id: "monitoring-logging",
      name: "Monitoring and Logging",
      weightPercent: 15,
      topics: [
        "CloudWatch metrics, alarms, composite alarms, and anomaly detection",
        "Centralized logging: CloudWatch Logs, subscription filters, Kinesis",
        "Distributed tracing with X-Ray and ServiceLens",
        "Log aggregation across accounts and regions",
        "Dashboards, Synthetics canaries, and RUM",
      ],
    },
    {
      id: "incident-event-response",
      name: "Incident and Event Response",
      weightPercent: 14,
      topics: [
        "EventBridge rules for event-driven remediation",
        "Systems Manager Automation runbooks and Incident Manager",
        "AWS Config rules with auto-remediation actions",
        "Health events and fault injection with FIS",
        "Troubleshooting failed deployments and rollback automation",
      ],
    },
    {
      id: "security-compliance",
      name: "Security and Compliance",
      weightPercent: 17,
      topics: [
        "IAM at scale: permission boundaries, SCPs, cross-account roles",
        "Security monitoring: GuardDuty, Security Hub, Inspector, Detective",
        "Secrets management and credential rotation automation",
        "Compliance auditing: Config conformance packs, Audit Manager, CloudTrail",
        "Encryption automation with KMS and certificate management with ACM",
      ],
    },
  ],
}
