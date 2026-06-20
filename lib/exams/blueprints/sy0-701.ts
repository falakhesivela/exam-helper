import type { ExamBlueprint } from "../types"

export const sy0701Blueprint: ExamBlueprint = {
  examCode: "SY0-701",
  exam: "CompTIA Security+",
  provider: "comptia",
  questionCount: 90,
  durationMin: 90,
  passMark: 75,
  questionMix: { singleChoice: 0.7, multipleResponse: 0.3 },
  questionTypeMix: { drag_match: 0.07, drag_categorize: 0.05 },
  styleGuide: { scenarioHeavy: true },
  domains: [
    {
      id: "general-security",
      name: "General Security Concepts",
      weightPercent: 12,
      topics: [
        "CIA triad and security controls",
        "Change management and asset management",
        "Cryptography basics: symmetric, asymmetric, hashing",
        "Digital certificates and PKI",
      ],
    },
    {
      id: "threats",
      name: "Threats, Vulnerabilities, and Mitigations",
      weightPercent: 22,
      topics: [
        "Malware types and attack vectors",
        "Social engineering and phishing",
        "Vulnerability scanning and penetration testing",
        "Indicators of compromise",
      ],
    },
    {
      id: "architecture",
      name: "Security Architecture",
      weightPercent: 18,
      topics: [
        "Network segmentation and zero trust",
        "Firewalls, IDS/IPS, and WAF",
        "Cloud security shared responsibility",
        "Secure network design patterns",
      ],
    },
    {
      id: "operations",
      name: "Security Operations",
      weightPercent: 28,
      topics: [
        "Incident response phases",
        "SIEM, SOAR, and log analysis",
        "Forensics and evidence handling",
        "Disaster recovery and continuity",
      ],
    },
    {
      id: "program",
      name: "Security Program Management and Oversight",
      weightPercent: 20,
      topics: [
        "Risk assessment and management frameworks",
        "Policies, standards, and procedures",
        "Compliance: GDPR, PCI-DSS, HIPAA overview",
        "Third-party risk and awareness training",
      ],
    },
  ],
}
