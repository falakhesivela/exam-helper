---
title: "Google Cloud ACE for AWS Engineers: A Translation Guide"
description: "Coming to the Associate Cloud Engineer exam from AWS? Most of your knowledge transfers — here's the service mapping, the four concepts that don't translate, and a four-week conversion plan."
slug: "gcp-ace-for-aws-engineers"
examCode: "GCP-ACE"
date: "2026-06-22"
updated: "2026-07-13"
---

If you hold an AWS certification and you are adding the [Google Cloud Associate Cloud Engineer](/exams/gcp-ace), here is the good news: perhaps 60% of your knowledge transfers directly.

Here is the bad news. The remaining 40% contains the concepts the exam tests hardest — precisely *because* they are where Google diverges from the AWS mental model. Your AWS instincts will carry you to a comfortable-feeling 60% and then actively work against you.

## The service mapping (the easy 60%)

| AWS | Google Cloud | Watch out for |
|---|---|---|
| EC2 | Compute Engine | Machine types named differently; custom machine types exist |
| S3 | Cloud Storage | Standard / Nearline / Coldline / Archive — **all** with millisecond access |
| Lambda | Cloud Functions / Cloud Run | **Cloud Run** is the default answer more often than Functions |
| EKS | GKE | GKE is far more central to this exam than EKS is to AWS exams |
| RDS | Cloud SQL | **Spanner has no real AWS equivalent** — global, relational, horizontally scalable |
| DynamoDB | Firestore / Bigtable | Firestore for app data; Bigtable for huge analytical/time-series loads |
| CloudWatch | Cloud Monitoring / Logging | Formerly Stackdriver; the old name still appears in the wild |
| IAM roles | IAM roles… but different | See below. This is the big one. |

Two notes on the storage row, because AWS habits mislead here. Google's cold tiers are **not Glacier**: Nearline, Coldline, and Archive all retrieve in milliseconds. What differs is the **minimum storage duration** — 30 days for Nearline, 90 for Coldline, 365 for Archive — and that is the detail the exam tests. If you reach for "retrieval takes hours," you have brought an AWS assumption with you.

## The four concepts that don't translate

### 1. Projects, not accounts

AWS isolates workloads with *accounts* inside an organisation. Google uses **projects**, inside folders, inside an organisation.

The project is the boundary for billing, APIs, quotas, and most IAM. Exam questions assume this fluency — "how do you give the team access to the dev environment?" expects project-level thinking, not account-level. There is no ACE equivalent of the AWS multi-account dance.

### 2. IAM inheritance is the exam's favourite topic

This is the single biggest source of wrong answers for AWS engineers, and it is worth reading twice.

Google IAM policies attach at organisation, folder, project, or resource level, and they are **additive down the hierarchy**. There are **no deny rules** in the AWS sense.

**A role granted at the folder level cannot be revoked by anything below it.** You cannot "deny" it back at the project. Coming from AWS's explicit-deny-always-wins model, this inversion breaks a deeply held instinct — and the exam builds questions specifically around it.

If an option says "add a deny policy at the project level to restrict access," it is wrong, because that is AWS thinking. The correct answer is to grant the role at the right level in the first place.

### 3. Service accounts work in two directions

In AWS, you attach a role to an instance and you are done.

In Google, a VM **runs as** a service account — *and* you separately control which humans can **impersonate or deploy as** that service account (the `iam.serviceAccountUser` role). It is a two-sided model: what the machine can do, and who can act as the machine.

Questions probe both sides, and AWS engineers routinely answer only the first half.

### 4. Networks are global

A VPC **spans all regions**. Subnets are **regional** — not zonal, and not AZ-scoped like AWS subnets.

Firewall rules attach to the *network* and use **tags or service accounts** as targets. There is no security group attached to an instance.

The practical consequence: **cross-region private communication inside one VPC just works.** No peering, no transit gateway, nothing. AWS engineers reliably reach for peering here and get the question wrong, because they are solving a problem Google does not have.

## The gcloud factor

AWS associate exams rarely quote CLI commands. **The ACE quotes them constantly.** You will see four `gcloud` invocations and be asked which one accomplishes a task.

Do not memorise flags from a list. The grammar is consistent — `gcloud <group> <subgroup> <verb>` — and once you internalise the shape, wrong options start to look obviously wrong:

- `gcloud compute instances create | list | describe | delete`
- `gcloud container clusters create | get-credentials`
- `gcloud projects add-iam-policy-binding`
- `gcloud config set project` / `gcloud config configurations activate`
- `gcloud storage` (the modern replacement for `gsutil`)
- `kubectl` for anything **inside** a cluster — if the question is about pods, deployments, or services, it is *not* a `gcloud` command

Spend a few evenings in Cloud Shell doing real tasks: create instances, deploy to Cloud Run, get GKE credentials, switch projects. Command questions then become free marks, because you will recognise the shapes rather than reasoning about them.

One small thing that appears more often than anyone expects: **`gcloud config set project`**. Switching project and configuration context is a real, tested operation, not a footnote.

## The database decision tree

Worth its own section, because AWS gives you fewer choices and the extra ones matter:

| Requirement | Service |
|---|---|
| Relational, single region, standard SQL workload | Cloud SQL |
| Relational, **global**, horizontally scalable, strongly consistent | Cloud Spanner |
| Document NoSQL for app/mobile data, real-time sync | Firestore |
| Wide-column NoSQL, enormous scale, time-series or IoT | Bigtable |
| Analytics and warehousing over huge datasets | BigQuery |

The boundary the exam pushes hardest: **Cloud SQL vs Spanner.** Spanner is not the default answer just because it is impressive — it is expensive, and the exam knows it. Only reach for it when the requirement genuinely says global scale *with* strong consistency.

## A four-week conversion plan

- **Week 1 — The resource hierarchy, IAM, and service accounts.** Explicitly *unlearn* the AWS model. Spend real time on additive inheritance and the absence of deny rules, because this is where your instincts are actively wrong rather than merely absent.
- **Week 2 — Compute (heavy GKE emphasis) and networking**, with hands-on `gcloud` throughout.
- **Week 3 — Storage and the database decision tree, plus operations tooling** (Cloud Monitoring, Logging, log sinks).
- **Week 4 — Fresh practice questions daily.**

Your AWS instincts will get you to 60% quickly, and that is exactly the trap: 60% feels close, and the last 20 points are all in the four concepts above. Drill the divergent material until practice scores clear 80%, then book.
