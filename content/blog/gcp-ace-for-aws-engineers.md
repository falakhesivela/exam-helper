---
title: "Google Cloud ACE for AWS Engineers: A Translation Guide"
description: "Coming to the Associate Cloud Engineer exam from AWS? Most of your knowledge transfers — here's the mapping, plus the concepts that don't translate."
slug: "gcp-ace-for-aws-engineers"
examCode: "GCP-ACE"
date: "2026-06-22"
---

If you hold an AWS cert and you're adding the [Google Cloud Associate Cloud Engineer](/exams/gcp-ace), good news: perhaps 60% of your knowledge transfers directly. The bad news is that the remaining 40% contains the concepts the exam tests hardest — precisely because they're where Google diverges from the AWS mental model. Here's the translation table, and the traps.

## The service mapping (the easy 60%)

| AWS | Google Cloud | Watch out for |
|---|---|---|
| EC2 | Compute Engine | Machine types are named differently; custom machine types exist |
| S3 | Cloud Storage | Classes: Standard/Nearline/Coldline/Archive, all with millisecond access |
| Lambda | Cloud Functions / Cloud Run | Cloud Run (containers) is the default answer more often than Functions |
| EKS | GKE | GKE is far more central to the exam than EKS is to AWS exams |
| RDS | Cloud SQL | Spanner has no real AWS equivalent — global, relational, horizontally scalable |
| DynamoDB | Firestore / Bigtable | Firestore for app data, Bigtable for huge analytical/time-series loads |
| CloudWatch | Cloud Monitoring / Logging | Formerly Stackdriver; old name still appears in the wild |
| IAM roles | IAM roles… but different | See below — this is the big one |

## The concepts that don't translate

**Projects, not accounts.** AWS isolates workloads with accounts inside an organisation; Google uses *projects* inside folders inside an organisation. Projects are the boundary for billing, APIs, quotas, and most IAM. Exam questions assume this fluency — "how do you give the team access to the dev environment?" expects project-level thinking, not account-level.

**IAM inheritance is the exam's favourite topic.** Policies attach at organisation, folder, project, or resource level and are *additive* down the hierarchy — there are no deny rules in the AWS sense. A role granted at folder level cannot be revoked by anything below it. Coming from AWS's explicit-deny model, this inversion is the single most common source of wrong answers.

**Service accounts work differently.** In AWS you attach a role to an instance; in Google, a VM runs *as* a service account, and you also control which humans can impersonate or deploy as that service account (`iam.serviceAccountUser`). Questions probe this two-sided model.

**Networks are global.** A VPC spans all regions; subnets are regional (not zonal, and not AZ-scoped like AWS). Firewall rules attach to the network and use tags or service accounts as targets — there is no security group attached to an instance. Cross-region private communication inside one VPC just works, which regularly trips AWS engineers who reach for peering.

## The gcloud factor

AWS associate exams rarely quote CLI commands; the ACE quotes them constantly. You'll see four `gcloud` invocations and be asked which accomplishes a task. Don't memorise flags from a list — spend a few evenings in Cloud Shell doing real tasks: create instances, deploy to Cloud Run, get GKE credentials, switch projects with `gcloud config`. Command questions then become free marks because you'll recognise the shapes.

## A four-week conversion plan

Week 1: the resource hierarchy, IAM, and service accounts — unlearn the AWS model explicitly. Week 2: compute (heavy GKE emphasis) and networking with hands-on `gcloud` throughout. Week 3: storage and the database decision tree, plus operations tooling. Week 4: fresh practice questions daily. Your AWS instincts will get you to 60% quickly; drill the divergent concepts until practice scores clear 80%, then book.
