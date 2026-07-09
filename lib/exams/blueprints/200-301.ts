import type { ExamBlueprint } from "../types"

export const ccna200301Blueprint: ExamBlueprint = {
  examCode: "200-301",
  exam: "Cisco CCNA",
  provider: "cisco",
  questionCount: 100,
  durationMin: 120,
  passMark: 82,
  questionMix: { singleChoice: 0.85, multipleResponse: 0.15 },
  questionTypeMix: {
    drag_match: 0.06,
    drag_order: 0.05,
    drag_categorize: 0.04,
    command_input: 0.1,
  },
  styleGuide: { scenarioHeavy: true },
  domains: [
    {
      id: "network-fundamentals",
      name: "Network Fundamentals",
      weightPercent: 20,
      topics: [
        "Network components: routers, switches, APs, controllers",
        "Network topology architectures: two-tier, three-tier, spine-leaf",
        "Physical interface and cabling types",
        "IPv4/IPv6 addressing, subnetting, and verification",
      ],
    },
    {
      id: "network-access",
      name: "Network Access",
      weightPercent: 20,
      topics: [
        "VLANs, trunking, and inter-VLAN routing",
        "Wireless fundamentals: WPA, SSID, RF principles",
        "Spanning Tree Protocol basics",
        "Cloud-managed and on-prem device access",
      ],
    },
    {
      id: "ip-connectivity",
      name: "IP Connectivity",
      weightPercent: 25,
      topics: [
        "Routing concepts: static and dynamic routing",
        "OSPF v2/v3 configuration and verification",
        "First-hop redundancy protocols",
        "NAT and PAT configuration",
      ],
    },
    {
      id: "ip-services",
      name: "IP Services",
      weightPercent: 10,
      topics: [
        "DHCP, DNS, SNMP, and NTP",
        "QoS concepts: marking, queuing, shaping",
        "SSH, FTP, and TFTP for device management",
        "Syslog and network time synchronization",
      ],
    },
    {
      id: "security-fundamentals",
      name: "Security Fundamentals",
      weightPercent: 15,
      topics: [
        "Security concepts: threats, vulnerabilities, exploits",
        "Device access control: passwords, SSH, ACLs",
        "Layer 2 security: DHCP snooping, DAI, port security",
        "VPN and wireless security fundamentals",
      ],
    },
    {
      id: "automation-programmability",
      name: "Automation and Programmability",
      weightPercent: 10,
      topics: [
        "REST APIs, JSON, and HTTP verbs",
        "Automation tools: Ansible and Terraform overview",
        "AI and machine learning in network operations",
        "Controller-based networking concepts",
      ],
    },
  ],
}
