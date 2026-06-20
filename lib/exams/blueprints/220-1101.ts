import type { ExamBlueprint } from "../types"

export const aPlus2201101Blueprint: ExamBlueprint = {
  examCode: "220-1101",
  exam: "CompTIA A+ Core 1",
  provider: "comptia",
  questionCount: 90,
  durationMin: 90,
  passMark: 75,
  questionMix: { singleChoice: 0.85, multipleResponse: 0.15 },
  questionTypeMix: {
    drag_match: 0.08,
    drag_order: 0.05,
    drag_categorize: 0.04,
  },
  styleGuide: { scenarioHeavy: true },
  domains: [
    {
      id: "mobile-devices",
      name: "Mobile Devices",
      weightPercent: 15,
      topics: [
        "Laptop hardware: RAM, storage, displays, batteries",
        "Mobile device types: smartphones, tablets, wearables",
        "Mobile accessories and connectivity: Bluetooth, NFC, hotspots",
        "Mobile device synchronization and configuration",
      ],
    },
    {
      id: "networking",
      name: "Networking",
      weightPercent: 20,
      topics: [
        "TCP/IP, ports, and protocols (HTTP, DNS, DHCP, SSH)",
        "Wireless standards: Wi-Fi bands, security, and troubleshooting",
        "Network hardware: switches, routers, access points",
        "Cable types and connectors: copper, fiber, Ethernet",
      ],
    },
    {
      id: "hardware",
      name: "Hardware",
      weightPercent: 25,
      topics: [
        "Motherboards, CPUs, RAM types and installation",
        "Storage devices: HDD, SSD, NVMe, RAID basics",
        "Peripherals, printers, and multifunction devices",
        "Power supplies, cooling, and BIOS/UEFI settings",
      ],
    },
    {
      id: "virtualization-cloud",
      name: "Virtualization and Cloud Computing",
      weightPercent: 11,
      topics: [
        "Client-side virtualization and hypervisors",
        "Cloud concepts: IaaS, SaaS, shared responsibility",
        "Virtual desktops and application virtualization",
        "Basic cloud storage and synchronization services",
      ],
    },
    {
      id: "troubleshooting",
      name: "Hardware and Network Troubleshooting",
      weightPercent: 29,
      topics: [
        "Structured troubleshooting methodology",
        "Common hardware failures and diagnostic tools",
        "Network connectivity issues and cable faults",
        "Mobile device and printer troubleshooting",
      ],
    },
  ],
}
