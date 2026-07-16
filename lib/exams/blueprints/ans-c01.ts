import type { ExamBlueprint } from "../types"

export const ansC01Blueprint: ExamBlueprint = {
  examCode: "ANS-C01",
  exam: "AWS Certified Advanced Networking – Specialty",
  provider: "aws",
  questionCount: 65,
  durationMin: 170,
  passMark: 75,
  questionMix: { singleChoice: 0.65, multipleResponse: 0.35 },
  styleGuide: { scenarioHeavy: true, servicesShortNames: true },
  domains: [
    {
      id: "network-design",
      name: "Network Design",
      weightPercent: 30,
      topics: [
        "Edge network design: CloudFront, Global Accelerator, custom origins, edge security",
        "DNS architectures: Route 53 public/private zones, Resolver endpoints, hybrid DNS",
        "Load balancing design: ALB, NLB, GWLB placement, target types, TLS termination",
        "Hybrid connectivity design: Direct Connect (dedicated, hosted, gateways), Site-to-Site VPN, MACsec",
        "Multi-account/multi-VPC design: Transit Gateway, VPC peering, PrivateLink, shared VPCs",
        "IP planning: CIDR strategy, IPv6 adoption, overlapping address mitigation",
      ],
    },
    {
      id: "network-implementation",
      name: "Network Implementation",
      weightPercent: 26,
      topics: [
        "Routing implementation: BGP path selection, route propagation, Transit Gateway route tables",
        "Direct Connect implementation: VIF types, LAG, resiliency models, failover testing",
        "Hybrid DNS implementation: Resolver forwarding rules, conditional forwarding",
        "Network automation: CloudFormation/CDK for network stacks, drift management",
        "Container and serverless networking: EKS CNI, ECS networking modes, Lambda in VPCs",
      ],
    },
    {
      id: "network-management-operation",
      name: "Network Management and Operation",
      weightPercent: 20,
      topics: [
        "Monitoring and analysis: VPC flow logs, Traffic Mirroring, CloudWatch network metrics",
        "Connectivity troubleshooting: Reachability Analyzer, Network Access Analyzer, route debugging",
        "Optimizing network performance: MTU/jumbo frames, placement groups, enhanced networking",
        "Operating hybrid links: DX/VPN failover behavior, BGP tuning, bandwidth management",
        "Change management and network configuration auditing",
      ],
    },
    {
      id: "network-security-compliance",
      name: "Network Security, Compliance, and Governance",
      weightPercent: 24,
      topics: [
        "Perimeter protection: Network Firewall, WAF, Shield Advanced, DDoS mitigation",
        "Traffic inspection architectures: GWLB appliances, centralized inspection VPCs",
        "Network threat detection: GuardDuty findings, DNS Firewall, flow log analysis",
        "Encryption in transit: TLS everywhere, VPN encryption, MACsec on Direct Connect",
        "Compliance and governance: Firewall Manager policies, security group auditing, Config rules",
      ],
    },
  ],
}
