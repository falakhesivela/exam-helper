---
description: "Deployment is 24% of the DVA-C02 — the CodeSuite, Lambda aliases, and the traffic-shifting strategies the exam names directly. What it tests and how to study it."
---

## What this domain actually tests

The CI/CD toolchain and, above all, **deployment strategies** — which is where most of the domain's marks sit.

The cast: **CodePipeline** orchestrates, **CodeBuild** builds and tests (know the `buildspec.yml` structure and its phases), **CodeDeploy** releases. **CloudFormation** and **SAM** underneath, with SAM being a shorthand transform that expands into plain CloudFormation.

The strategies are what the exam actually asks about, and it often names them literally:

- **All-at-once** — fastest, riskiest, brief downtime.
- **Rolling** — replace instances in batches.
- **Blue/green** — stand up a whole new environment, switch traffic, keep the old one for instant rollback.
- **Canary** — shift a small percentage of traffic, wait, then shift the rest.
- **Linear** — shift an equal increment every N minutes.

A configuration named `Canary10Percent5Minutes` means exactly what it says: send 10% of traffic to the new version, wait five minutes, then send the remaining 90%. Questions describe a risk appetite — "we want to catch errors on a small subset of users before full rollout" — and expect the matching name.

## The traps

**Blue/green means different things on different compute.** On **EC2**, it swaps *instances* behind a load balancer. On **Lambda and ECS**, it shifts *traffic by weight*. Questions specify the compute platform and the strategy must match it. Candidates who learned the strategies abstractly get caught here.

**Lambda versions and aliases underpin all of it.** A **version** is immutable. An **alias** is a movable pointer to a version, and **weighted aliases are the actual mechanism** by which canary and linear traffic shifting work. `$LATEST` is mutable and should never be what production points at — options suggesting it are wrong.

**Automatic rollback on a CloudWatch alarm** is the standard answer to "roll back automatically when the error rate spikes." If a question asks for hands-off rollback, look for the alarm.

**In-place deployment has no instant rollback.** If the requirement mentions the ability to roll back immediately, in-place is eliminated and blue/green is almost certainly the answer.

## How to study it

Deploy something. A Lambda behind API Gateway, released through CodePipeline, with an alias and a canary configuration. Then deliberately deploy a broken version and watch the alarm roll it back. That single exercise teaches you aliases, weights, alarms, and rollback in one sitting, and all four are tested.

Then build a small grid on paper: compute platform down the side (EC2, ECS, Lambda), strategies across the top, and which combinations are valid. The exam lives in that grid, and it is a twenty-minute job to fill in.

At 24% of the exam, deployment is worth roughly sixteen questions — and unlike the reasoning-heavy parts of AWS exams, most of them are decided by facts you can simply learn.
