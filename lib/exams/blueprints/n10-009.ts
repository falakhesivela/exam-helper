import type { ExamBlueprint } from "../types"

export const n10009Blueprint: ExamBlueprint = {
  examCode: "N10-009",
  exam: "CompTIA Network+",
  provider: "comptia",
  questionCount: 90,
  durationMin: 90,
  passMark: 75,
  questionMix: { singleChoice: 0.8, multipleResponse: 0.2 },
  questionTypeMix: {
    drag_match: 0.08,
    drag_order: 0.05,
    drag_categorize: 0.04,
    command_input: 0.05,
  },
  styleGuide: { scenarioHeavy: true },
  domains: [
    {
      id: "networking-concepts",
      name: "Networking Concepts",
      weightPercent: 23,
      topics: [
        "OSI and TCP/IP models",
        "Ports, protocols, and services",
        "IP addressing, subnetting, and IPv6",
        "Network topologies and transmission media",
      ],
    },
    {
      id: "network-implementation",
      name: "Network Implementation",
      weightPercent: 20,
      topics: [
        "Routing: static, dynamic, and default routes",
        "Switching: VLANs, trunking, and STP basics",
        "Wireless standards, channels, and security",
        "Network appliances: load balancers, firewalls, proxies",
      ],
    },
    {
      id: "network-operations",
      name: "Network Operations",
      weightPercent: 19,
      topics: [
        "Network monitoring and documentation",
        "DHCP, DNS, NTP, and network services",
        "Disaster recovery: RPO, RTO, backup sites",
        "Remote access: VPNs, SSH, and out-of-band management",
      ],
    },
    {
      id: "network-security",
      name: "Network Security",
      weightPercent: 14,
      topics: [
        "Security concepts: defense in depth, zero trust",
        "Authentication, authorization, and encryption",
        "Network attacks and mitigation techniques",
        "Physical security and segmentation",
      ],
    },
    {
      id: "network-troubleshooting",
      name: "Network Troubleshooting",
      weightPercent: 24,
      topics: [
        "Troubleshooting methodology and tools",
        "Cable, connectivity, and wireless issues",
        "Performance and latency problems",
        "Security-related network symptoms",
      ],
    },
  ],
}
