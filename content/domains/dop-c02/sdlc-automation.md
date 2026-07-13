---
description: "SDLC Automation is 22% of the DOP-C02 — the biggest domain. Cross-account pipelines, deployment strategies per compute platform, and automatic rollback."
---

## What this domain actually tests

The largest domain on the exam: CodePipeline, CodeBuild, and CodeDeploy — but **at scale**, which is what separates it from the Developer Associate.

The shape you must know cold is the **cross-account pipeline**: a pipeline role in the tooling account assumes a deployment role in the target account, and the artifact bucket's KMS key must be shared with both. Questions describe an organisation with separate dev, staging, and production accounts and ask how the pipeline reaches them. If you have never built this, the options all look equally plausible.

Then **manual approval actions**, automated test gates, and artifact management.

## The traps

**Which deployment strategies exist for which compute platform.** This is what the domain actually tests, and abstract knowledge of "blue/green" is not enough:

- **EC2** — blue/green swaps *instances* behind the load balancer. In-place has no instant rollback.
- **Lambda and ECS** — shift *traffic by weight*, via an alias or the ECS deployment controller. This is where canary and linear live.

A question naming ECS and offering an EC2-style instance swap is offering you a wrong answer that sounds right.

**Automatic rollback on a CloudWatch alarm** is the standard answer to "deployments must roll back automatically when errors exceed 1%." If the requirement is hands-off rollback, look for the alarm — not for a runbook and not for a human.

**Event-driven beats scheduled, always.** If one option triggers a pipeline from an EventBridge event and another polls a repository every five minutes, the event-driven one wins. Polling is a wrong answer by default at professional level.

**CodeDeploy lifecycle hooks** let you run validation before traffic shifts. Questions about "verifying the new version before customers see it" are pointing here.

## How to study it

Build a pipeline that deploys into a **second AWS account**. This is the single highest-value weekend project for the whole exam, because it forces you through the cross-account role trust, the KMS key policy, and the artifact bucket permissions — three things that are almost impossible to learn from reading and that show up repeatedly.

Then deploy a deliberately broken Lambda version behind a canary configuration with a CloudWatch alarm, and watch it roll itself back. You will remember that far longer than any diagram.

Finally, draw the compute-versus-strategy grid: EC2, ECS, and Lambda down one side; all-at-once, rolling, blue/green, canary, and linear across the top. Mark which combinations are real. The exam lives inside that grid, and filling it in takes twenty minutes.
