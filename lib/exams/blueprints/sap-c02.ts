import type { ExamBlueprint } from "../types"

export const sapC02Blueprint: ExamBlueprint = {
  examCode: "SAP-C02",
  exam: "AWS Certified Solutions Architect – Professional",
  provider: "aws",
  questionCount: 75,
  durationMin: 180,
  passMark: 75,
  questionMix: { singleChoice: 0.65, multipleResponse: 0.35 },
  styleGuide: { scenarioHeavy: true, servicesShortNames: true },
  domains: [
    {
      id: "organizational-complexity",
      name: "Design Solutions for Organizational Complexity",
      weightPercent: 26,
      topics: [
        "Cross-account networking: Transit Gateway, PrivateLink, Direct Connect, VPN at scale",
        "Multi-account security: Organizations, SCPs, IAM Identity Center, delegated administration",
        "Hybrid DNS and centralized egress/ingress architectures",
        "Cost governance across accounts: consolidated billing, budgets, tagging strategies, Cost Explorer",
        "Multi-account deployments: StackSets, Control Tower, Service Catalog, AWS RAM",
      ],
    },
    {
      id: "design-new-solutions",
      name: "Design for New Solutions",
      weightPercent: 29,
      topics: [
        "Deployment strategies for complex workloads: blue/green, canary, feature isolation",
        "Business continuity design: RTO/RPO-driven DR architectures, multi-Region failover",
        "Security controls: encryption strategy, edge protection with WAF/Shield, secrets management",
        "Reliability: decoupling with SQS/SNS/EventBridge, Auto Scaling, cell-based architectures",
        "Performance and cost objectives: compute selection, storage tiers, caching layers",
        "Serverless and event-driven design: Lambda, Step Functions, API Gateway at scale",
      ],
    },
    {
      id: "continuous-improvement",
      name: "Continuous Improvement for Existing Solutions",
      weightPercent: 25,
      topics: [
        "Operational excellence: observability with CloudWatch, X-Ray, centralized logging",
        "Tightening security posture: GuardDuty, Security Hub, Config remediation, least privilege reviews",
        "Improving reliability: fault isolation, health-check-driven failover, chaos testing with FIS",
        "Performance improvements: right-sizing, Graviton, caching, read replicas, Global Accelerator",
        "Cost optimization reviews: Savings Plans, storage lifecycle policies, idle resource cleanup",
      ],
    },
    {
      id: "migration-modernization",
      name: "Accelerate Workload Migration and Modernization",
      weightPercent: 20,
      topics: [
        "Portfolio assessment: Migration Evaluator, Application Discovery Service, the 7 Rs",
        "Migration execution: MGN for rehost, DMS/SCT for databases, DataSync and Transfer Family",
        "Landing zone and network readiness for large migrations",
        "Modernization paths: containers on ECS/EKS, serverless refactoring, Step Functions workflows",
        "Decomposing monoliths: strangler fig pattern, event-driven integration, purpose-built databases",
      ],
    },
  ],
}
