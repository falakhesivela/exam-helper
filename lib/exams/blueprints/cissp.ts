import type { ExamBlueprint } from "../types"

export const cisspBlueprint: ExamBlueprint = {
  examCode: "CISSP",
  exam: "ISC2 CISSP",
  provider: "isc2",
  questionCount: 125,
  durationMin: 180,
  passMark: 70,
  questionMix: { singleChoice: 0.9, multipleResponse: 0.1 },
  styleGuide: { scenarioHeavy: true, managerialTone: true },
  domains: [
    {
      id: "security-risk-management",
      name: "Security and Risk Management",
      weightPercent: 16,
      topics: [
        "Security governance and compliance frameworks",
        "Risk assessment, treatment, and metrics",
        "Business continuity and disaster recovery",
        "Legal, regulatory, and privacy requirements",
      ],
    },
    {
      id: "asset-security",
      name: "Asset Security",
      weightPercent: 10,
      topics: [
        "Data classification and handling requirements",
        "Data retention, destruction, and privacy",
        "Asset lifecycle and ownership",
        "Protecting sensitive information at rest and in transit",
      ],
    },
    {
      id: "security-architecture",
      name: "Security Architecture and Engineering",
      weightPercent: 13,
      topics: [
        "Security models and design principles",
        "Cryptography: symmetric, asymmetric, hashing, PKI",
        "Secure design patterns for cloud and hybrid systems",
        "Physical security controls",
      ],
    },
    {
      id: "communication-network-security",
      name: "Communication and Network Security",
      weightPercent: 13,
      topics: [
        "Secure network architecture and segmentation",
        "VPNs, TLS, and secure protocols",
        "Wireless and remote access security",
        "Network attacks and countermeasures",
      ],
    },
    {
      id: "iam",
      name: "Identity and Access Management",
      weightPercent: 13,
      topics: [
        "Identification, authentication, and authorization",
        "Federation, SSO, and directory services",
        "Privileged access management",
        "Identity lifecycle and access reviews",
      ],
    },
    {
      id: "security-assessment-testing",
      name: "Security Assessment and Testing",
      weightPercent: 12,
      topics: [
        "Vulnerability assessments and penetration testing",
        "Security audits and control testing",
        "Security metrics and reporting",
        "Third-party assessment and supply chain risk",
      ],
    },
    {
      id: "security-operations",
      name: "Security Operations",
      weightPercent: 13,
      topics: [
        "Incident response and forensics",
        "Logging, monitoring, and SIEM",
        "Malware analysis and containment",
        "Disaster recovery and backup operations",
      ],
    },
    {
      id: "software-development-security",
      name: "Software Development Security",
      weightPercent: 10,
      topics: [
        "Secure SDLC and threat modeling",
        "Application security testing: SAST, DAST",
        "Software supply chain and dependency risk",
        "API security and secure coding practices",
      ],
    },
  ],
}
