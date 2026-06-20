import type { ExamBlueprint } from "../types"

export const gcpAceBlueprint: ExamBlueprint = {
  examCode: "GCP-ACE",
  exam: "Google Cloud Associate Cloud Engineer",
  provider: "gcp",
  questionCount: 50,
  durationMin: 120,
  passMark: 70,
  questionMix: { singleChoice: 0.75, multipleResponse: 0.25 },
  styleGuide: { scenarioHeavy: true },
  domains: [
    {
      id: "setting-up",
      name: "Setting up a Cloud Solution Environment",
      weightPercent: 22,
      topics: [
        "Projects, folders, and organization hierarchy",
        "Billing accounts and budgets",
        "gcloud CLI and Cloud Console",
        "IAM roles and service accounts",
      ],
    },
    {
      id: "planning",
      name: "Planning and Configuring a Cloud Solution",
      weightPercent: 22,
      topics: [
        "Compute Engine machine types and disks",
        "Cloud Storage classes and lifecycle rules",
        "VPC networks, subnets, and firewall rules",
        "Cloud SQL and Cloud Spanner overview",
      ],
    },
    {
      id: "deploying",
      name: "Deploying and Implementing a Cloud Solution",
      weightPercent: 28,
      topics: [
        "Compute Engine instance management",
        "GKE cluster basics and workloads",
        "Cloud Run and App Engine",
        "Cloud Functions triggers",
        "Load balancing and autoscaling",
      ],
    },
    {
      id: "operations",
      name: "Ensuring Successful Operation of a Cloud Solution",
      weightPercent: 28,
      topics: [
        "Cloud Monitoring and Logging",
        "Cloud Deployment Manager and Terraform overview",
        "Identity-Aware Proxy and VPC Service Controls",
        "Troubleshooting connectivity and permissions",
      ],
    },
  ],
}
