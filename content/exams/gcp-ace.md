---
title: "Google Cloud Associate Cloud Engineer (ACE) Study Guide"
description: "How to prepare for Google Cloud's hands-on associate exam: what ACE covers, how gcloud fluency is tested, and a practical study plan."
examCode: "GCP-ACE"
slug: "gcp-ace"
updated: "2026-07-13"
---

The Google Cloud Associate Cloud Engineer certification proves you can deploy, monitor, and operate workloads on Google Cloud. It's the most hands-on of the entry-tier cloud certs: where other vendors test recognition, ACE regularly quotes `gcloud` commands and expects you to spot the right one.

## Who should take it

Google recommends six months or more of hands-on Google Cloud experience. ACE suits engineers joining GCP shops, AWS or Azure engineers adding a second cloud, and anyone targeting Google Cloud roles — it's commonly treated as the qualifying bar for junior cloud engineering positions.

## How the exam is scored

Roughly 50–60 questions in two hours. Google doesn't publish a numeric pass mark; results are simply pass/fail. Questions are shorter than AWS scenarios but more operational: many present a task and four `gcloud` invocations or console workflows, and you pick the correct one.

## What to focus on

- **The resource hierarchy.** Organisation → folders → projects, how IAM policies inherit down it, and why projects (not accounts) are the billing and isolation boundary. This is the single most-tested concept.
- **IAM.** Primitive vs predefined vs custom roles, service accounts (creating, granting, impersonating), and the principle of using predefined roles over primitive ones.
- **Compute options.** Compute Engine (machine types, preemptible/Spot VMs, instance groups), GKE (clusters, node pools, autoscaling, kubectl basics), Cloud Run, and App Engine — and, crucially, *when* to choose each.
- **Storage and databases.** Cloud Storage classes and lifecycle rules, and the decision tree across Cloud SQL, Spanner, Firestore, Bigtable, and BigQuery.
- **Networking.** VPCs (auto vs custom mode), firewall rules, shared VPC, load balancer types, and Cloud NAT.
- **Operations.** Cloud Monitoring, Cloud Logging, budgets and billing alerts, and log-based metrics.

## gcloud fluency

You don't need to memorise every flag, but you must recognise command structure: `gcloud compute instances create`, `gcloud container clusters get-credentials`, `gsutil` vs `gcloud storage`, and `kubectl` for anything inside a cluster. The free tier plus the always-free e2-micro instance is enough to practise nearly everything — run the commands yourself and the exam's command questions become easy marks.

## Common pitfalls

Candidates most often miss questions about the resource hierarchy and IAM inheritance, choose the wrong database for a scale/consistency requirement (learn the Spanner vs Cloud SQL and Firestore vs Bigtable boundaries), and confuse which load balancer is global vs regional. Also know how to switch projects and configurations in `gcloud config` — it appears more often than you'd expect.

## After you pass

The certificate is valid for three years. Engineers who enjoyed ACE usually progress to the Professional Cloud Architect, or add breadth with [AWS](/exams/saa-c03) or [Azure](/exams/az-104) associate certs for multi-cloud credibility.
