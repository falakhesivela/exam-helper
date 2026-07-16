import type { ExamBlueprint } from "../types"

export const clfC02Blueprint: ExamBlueprint = {
  examCode: "CLF-C02",
  exam: "AWS Certified Cloud Practitioner",
  provider: "aws",
  questionCount: 65,
  durationMin: 90,
  passMark: 70,
  questionMix: { singleChoice: 0.85, multipleResponse: 0.15 },
  styleGuide: { scenarioHeavy: false },
  domains: [
    {
      id: "cloud-concepts",
      name: "Cloud Concepts",
      weightPercent: 24,
      topics: [
        "Benefits of cloud: elasticity, agility, global reach",
        "Cloud deployment models: public, private, hybrid",
        "AWS global infrastructure: Regions, AZs, edge locations",
        "Well-Architected Framework pillars overview",
      ],
    },
    {
      id: "security",
      name: "Security and Compliance",
      weightPercent: 30,
      topics: [
        "Shared responsibility model",
        "IAM users, groups, roles, policies",
        "Encryption at rest and in transit",
        "AWS compliance programs and Artifact",
      ],
    },
    {
      id: "technology",
      name: "Cloud Technology and Services",
      weightPercent: 34,
      topics: [
        "Core services: EC2, S3, RDS, Lambda, VPC basics",
        "Storage classes and use cases",
        "Compute options: instances, containers, serverless",
        "Networking: VPC, subnets, load balancers, Route 53",
      ],
    },
    {
      id: "billing",
      name: "Billing, Pricing, and Support",
      weightPercent: 12,
      topics: [
        "On-Demand, Reserved, Savings Plans, Spot pricing",
        "AWS Organizations and consolidated billing",
        "Cost Explorer, Budgets, and Trusted Advisor",
        "Support plans: Basic, Developer, Business, Enterprise",
      ],
    },
  ],
}
