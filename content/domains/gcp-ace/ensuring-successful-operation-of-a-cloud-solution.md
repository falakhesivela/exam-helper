---
description: "Ensuring Successful Operation is 28% of the GCP ACE — joint-largest. Cloud Monitoring and Logging, and the two things that always break: permissions and firewall rules."
---

## What this domain actually tests

The operations half of the exam, and it is joint-largest — which surprises people who assume the ACE is mostly about deploying things.

**Cloud Monitoring and Cloud Logging** (formerly Stackdriver — the old name still appears in the wild and occasionally in question text). Dashboards, alerting policies, **log-based metrics**, and **log sinks** that export logs to Cloud Storage or BigQuery for long-term retention and analysis. If a requirement mentions retaining logs beyond the default period or querying them at scale, that is a sink to BigQuery.

But the heart of the domain is **troubleshooting**, and here there is a genuinely useful shortcut.

## The traps

### When something can't connect, it is permissions or firewall

Almost every troubleshooting question on this exam reduces to one of two causes. Work through them in order:

1. **Permissions.** Does the service account have the role it needs? Remember service accounts are two-sided — the machine's identity *and* who may act as it.
2. **Firewall rules.** Is there an ingress rule allowing the traffic?

Google firewall rules are **stateful**, apply to the **VPC** (not the instance), and are matched **by priority, lowest number first**. They are scoped with **target tags or service accounts** — there is no security group attached to an instance the way there is in AWS. If an option describes attaching a security group to a VM, it is AWS thinking.

### Networks are global, subnets are regional

A VPC **spans all regions**. Subnets are **regional** — not zonal.

The practical consequence, and the thing that trips AWS engineers hardest: **cross-region private communication inside one VPC just works.** No peering. No transit gateway. Nothing to configure.

Candidates reach for VPC peering to solve a problem Google does not have, and get the question wrong.

### `gcloud config set project` appears more than you would think

Switching project and configuration context is a real, tested operation. If a `gcloud` command in a question seems correct but is operating on the wrong project, check whether the setup step is missing.

## How to study it

Deliberately break connectivity in a sandbox project. Deploy two instances, block traffic with a firewall rule, and work out why. Then remove a role from a service account and watch an operation fail with a permissions error — and learn to *recognise that error message*, because the exam describes it.

Then set up a log-based metric and an alerting policy on it.

The habit worth building: **when a scenario describes something not working, ask "permissions or firewall?" before anything else.** That single question resolves the majority of this domain, and it stops you reasoning elaborately about problems that have a boring cause.
