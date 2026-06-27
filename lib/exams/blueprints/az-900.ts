import type { ExamBlueprint } from "../types"

export const az900Blueprint: ExamBlueprint = {
  examCode: "AZ-900",
  exam: "Microsoft Azure Fundamentals",
  provider: "azure",
  questionCount: 40,
  durationMin: 45,
  passMark: 70,
  questionMix: { singleChoice: 0.9, multipleResponse: 0.1 },
  questionTypeMix: { drag_match: 0.05, select_grid: 0.08 },
  styleGuide: { scenarioHeavy: false },
  domains: [
    {
      id: "cloud-concepts",
      name: "Describe Cloud Concepts",
      weightPercent: 25,
      topics: [
        "Benefits of cloud computing",
        "IaaS, PaaS, SaaS models",
        "Public, private, and hybrid cloud",
        "CapEx vs OpEx",
      ],
    },
    {
      id: "azure-architecture",
      name: "Describe Azure Architecture and Services",
      weightPercent: 35,
      topics: [
        "Azure regions, geographies, and availability zones",
        "Core compute: VMs, App Service, ACI, AKS overview",
        "Storage: Blob, Files, Disk tiers",
        "Networking: VNet, VPN Gateway, ExpressRoute, DNS",
        "Databases: SQL Database, Cosmos DB overview",
      ],
    },
    {
      id: "management",
      name: "Describe Azure Management and Governance",
      weightPercent: 20,
      topics: [
        "Azure Portal, CLI, Cloud Shell",
        "ARM, resource groups, subscriptions",
        "Azure Policy and Blueprints",
        "Cost Management and Advisor",
      ],
    },
    {
      id: "security",
      name: "Describe Azure Identity, Access, and Security",
      weightPercent: 20,
      topics: [
        "Microsoft Entra ID (Azure AD)",
        "RBAC and Azure roles",
        "Microsoft Defender for Cloud",
        "Encryption and Key Vault basics",
      ],
    },
  ],
}
