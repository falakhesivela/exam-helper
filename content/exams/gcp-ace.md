---
title: "Google Cloud Associate Cloud Engineer (ACE) Study Guide"
description: "How to prepare for Google Cloud's hands-on associate exam: the four domains, the gcloud fluency it demands, the database decision tree, and a practical study plan."
examCode: "GCP-ACE"
slug: "gcp-ace"
updated: "2026-07-13"
faqs:
  - q: "Is the Google ACE harder than the AWS Solutions Architect Associate?"
    a: "Different, rather than harder. AWS asks you to choose an architecture from a scenario; Google asks you to operate one, often by picking the correct gcloud command. If you have never used the CLI, ACE feels harder. If you live in a terminal, it feels easier. The concept load is lower than SAA-C03; the hands-on expectation is higher."
  - q: "What score do I need to pass the ACE?"
    a: "Google does not publish a numeric passing score or a score report — the result is simply pass or fail. Prepare to be comfortably above the bar rather than trying to optimise to a number, and treat 80%+ on fresh practice questions as your signal to book."
---

The Google Cloud Associate Cloud Engineer certification proves you can deploy, monitor, and operate workloads on Google Cloud. It is the most hands-on of the entry-tier cloud certs: where other vendors test recognition, ACE regularly quotes `gcloud` commands and expects you to spot the right one.

## Who should take it

Google recommends six months or more of hands-on Google Cloud experience. ACE suits engineers joining GCP shops, AWS or Azure engineers adding a second cloud, and anyone targeting Google Cloud roles — it is commonly treated as the qualifying bar for junior cloud engineering positions.

## How the exam is scored

Roughly 50–60 questions in two hours. Google does not publish a numeric pass mark and does not give you a score — results are pass/fail only. Questions are shorter than AWS scenarios but more operational: many present a task and four `gcloud` invocations or console workflows, and you pick the correct one.

## The four domains, one by one

### Deploying and Implementing a Cloud Solution (28%)

The largest domain, and the most command-heavy. Compute Engine instance management, GKE cluster and workload basics, Cloud Run, App Engine, and Cloud Functions.

The recurring question is **which compute service** to choose, and the decision tree is cleaner than AWS's:

| If the workload is… | Use |
| --- | --- |
| A VM, or needs a specific OS/kernel or licensing | Compute Engine |
| A container, stateless, HTTP-driven, scale-to-zero | Cloud Run |
| Containers needing orchestration, sidecars, or complex networking | GKE |
| A small function reacting to an event | Cloud Functions |
| A web app you want fully managed with minimal config | App Engine |

Know **preemptible / Spot VMs** (cheap, can be reclaimed, for fault-tolerant batch work) and **managed instance groups** with autoscaling and health checks.

### Ensuring Successful Operation of a Cloud Solution (28%)

Joint-largest, and the operations half. Cloud Monitoring and Cloud Logging (dashboards, alerting policies, log-based metrics, and log sinks that export to Cloud Storage or BigQuery for retention).

Troubleshooting is heavily represented, and the two things that break are always the same: **permissions** and **firewall rules**. When a question describes something that cannot connect, work through whether the service account has the role it needs, and whether an ingress rule allows the traffic. GCP firewall rules are stateful, apply to the VPC, and are matched by priority (lowest number first) with target tags or service accounts scoping them.

Also: `kubectl` for anything inside a cluster, and `gcloud container clusters get-credentials` as the step people forget before running it.

### Setting up a Cloud Solution Environment (22%)

**The resource hierarchy is the single most-tested concept on this exam.** Organisation → folders → projects → resources. IAM policies set at any level **inherit downward** and are additive — a role granted at the folder level applies to every project inside it, and you cannot take it away lower down. The **project** is the fundamental unit of billing, quota, and isolation.

IAM: **primitive** roles (Owner, Editor, Viewer — broad, legacy, and almost always the wrong exam answer), **predefined** roles (per-service, least-privilege, and usually the right answer), and **custom** roles (when no predefined role fits). If an option grants Editor at the project level, be suspicious.

**Service accounts** are the machine identities — creating them, granting them roles, attaching them to VMs, and impersonating them. Know that you attach a service account to an instance rather than putting a key on it, for exactly the reason AWS says roles-not-keys.

Then billing accounts, budgets, and alerts.

### Planning and Configuring a Cloud Solution (22%)

Sizing and selection. Compute Engine machine families and persistent disk types. Cloud Storage classes — Standard, Nearline (30-day minimum), Coldline (90-day), Archive (365-day) — with lifecycle rules to move objects between them. The minimum storage durations are the tested detail.

VPC networks (**auto mode** creates a subnet in every region automatically; **custom mode** gives you control and is what you want in production), subnets, and firewall rules.

And the **database decision tree**, which is where most of the domain's marks live:

| Requirement | Service |
| --- | --- |
| Relational, single region, standard SQL workload | Cloud SQL |
| Relational, global, horizontally scalable, strong consistency | Cloud Spanner |
| Document NoSQL for app/mobile data, real-time sync | Firestore |
| Wide-column NoSQL, huge scale, low latency, time-series or IoT | Bigtable |
| Analytics and data warehousing over huge datasets | BigQuery |
| In-memory cache | Memorystore |

The two boundaries the exam pushes on: **Cloud SQL vs Spanner** (does it need to scale horizontally across regions with strong consistency? Only then Spanner — it is expensive and the exam knows it), and **Firestore vs Bigtable** (app data with queries vs enormous-scale key-based lookups).

## gcloud fluency

You do not need to memorise every flag, but you must recognise command *structure*. The grammar is consistent — `gcloud <group> <subgroup> <verb>` — and once you internalise it, wrong options start to look obviously wrong:

- `gcloud compute instances create|list|describe|delete`
- `gcloud container clusters create|get-credentials`
- `gcloud projects add-iam-policy-binding`
- `gcloud config set project` / `gcloud config configurations activate`
- `gcloud storage` (the modern replacement for `gsutil`)
- `kubectl` for anything *inside* a cluster — if the question is about pods, deployments, or services, it is not a `gcloud` command

The free tier plus the always-free e2-micro instance is enough to practise nearly all of this. Run the commands yourself and the command questions become free marks rather than guesswork.

## Common pitfalls

Candidates most often miss questions on the resource hierarchy and IAM inheritance — specifically, forgetting that policies are additive downward and that you cannot revoke an inherited role at a lower level.

After that: choosing the wrong database for a scale or consistency requirement (Spanner is not the default answer just because it is impressive), confusing which load balancers are global versus regional, and forgetting `gcloud config set project` — switching project and configuration context appears far more often than people expect.

Reaching for a primitive role (Editor, Owner) when a predefined one exists is also a reliable way to pick the wrong answer.

## After you pass

Check the [official ACE page](https://cloud.google.com/learn/certification/cloud-engineer) for current pricing and the exam guide.

The certificate is valid for three years. Engineers who enjoyed ACE usually progress to the Professional Cloud Architect, or add breadth with [AWS](/exams/saa-c03) or [Azure](/exams/az-104) associate certs for multi-cloud credibility.
