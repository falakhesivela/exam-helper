import type { ExamBlueprint } from "../types"

export const az104Blueprint: ExamBlueprint = {
  examCode: "AZ-104",
  exam: "Microsoft Certified: Azure Administrator Associate",
  provider: "azure",
  questionCount: 50,
  durationMin: 100,
  passMark: 70,
  questionMix: { singleChoice: 0.75, multipleResponse: 0.25 },
  questionTypeMix: { drag_match: 0.05, drag_order: 0.04 },
  styleGuide: { scenarioHeavy: true },
  domains: [
    {
      id: "identity",
      name: "Manage Azure Identities and Governance",
      weightPercent: 20,
      topics: [
        "Microsoft Entra ID users and groups",
        "RBAC role assignments at scope levels",
        "Azure Policy and resource locks",
        "Subscriptions and management groups",
      ],
    },
    {
      id: "storage",
      name: "Implement and Manage Storage",
      weightPercent: 20,
      topics: [
        "Storage accounts and redundancy options",
        "Blob access tiers and lifecycle management",
        "Azure Files and sync",
        "Backup and recovery for VMs and files",
      ],
    },
    {
      id: "compute",
      name: "Deploy and Manage Azure Compute Resources",
      weightPercent: 25,
      topics: [
        "VM sizing, disks, and availability sets",
        "VMSS and autoscaling",
        "App Service plans and deployment slots",
        "Containers: ACI and AKS basics",
      ],
    },
    {
      id: "networking",
      name: "Implement and Manage Virtual Networking",
      weightPercent: 20,
      topics: [
        "VNet design, subnets, and peering",
        "NSGs and Azure Firewall",
        "Load Balancer vs Application Gateway",
        "VPN Gateway and ExpressRoute",
      ],
    },
    {
      id: "monitoring",
      name: "Monitor and Maintain Azure Resources",
      weightPercent: 15,
      topics: [
        "Azure Monitor metrics and logs",
        "Log Analytics workspaces and alerts",
        "Azure Advisor recommendations",
        "Backup policies and Site Recovery",
      ],
    },
  ],
}
