---
title: "AWS DevOps Engineer Professional (DOP-C02) Study Guide"
description: "A preparation guide for AWS's hardest operations exam: what DOP-C02 covers, how professional-level questions differ, and how to study for them."
examCode: "DOP-C02"
slug: "dop-c02"
updated: "2026-07-13"
---

The AWS Certified DevOps Engineer – Professional is a genuinely hard exam. It assumes you can already do everything on the [Developer Associate](/exams/dva-c02) and asks you to automate it: multi-account deployments, self-healing infrastructure, compliance enforcement, and incident response — all expressed as long, dense scenarios with four plausible answers.

## Who should take it

AWS recommends two or more years of experience provisioning and operating AWS environments. Take that seriously: professional-level questions test judgment built from real operations, not memorised facts. The typical successful candidate holds the Developer or SysOps associate cert and works with CI/CD and infrastructure-as-code daily.

## How the exam is scored

75 questions in 180 minutes, scored 100–1,000 with a 750 pass mark. Three hours sounds generous, but the question stems are long — often a full paragraph plus multi-line answers — so time pressure is real. Budget roughly two minutes per question and flag anything that takes longer.

## What makes professional questions different

Associate questions ask *what* a service does. Professional questions give you a working system and a new requirement — "deployments must roll back automatically when errors exceed 1%", "all accounts must block public S3 buckets" — and ask for the *best* implementation among several that would work. The differentiators are almost always operational overhead, blast radius, and whether the solution is event-driven rather than scheduled.

## The core toolset

- **CloudFormation and CDK** — StackSets for multi-account rollout, custom resources, drift detection, and update behaviours (replacement vs in-place).
- **CodePipeline / CodeBuild / CodeDeploy** — cross-account pipelines, approval gates, and every deployment strategy for EC2, ECS, and Lambda.
- **EventBridge and automation** — the glue for nearly every "automatically respond to X" question, paired with Systems Manager Automation runbooks and Lambda.
- **AWS Organizations, Config, and Control Tower** — SCPs vs IAM policies, Config conformance packs with auto-remediation, and account-vending patterns.
- **Resilience machinery** — Auto Scaling policies, Route 53 failover, Aurora global databases, and backup/DR strategies against explicit RTO/RPO numbers.

## How to prepare

Give yourself eight to twelve weeks. Spend the first half building: a cross-account pipeline, a Config rule with auto-remediation, an EventBridge-triggered runbook. Spend the second half drilling full-length, professional-difficulty practice questions and doing honest post-mortems on every miss — at this level, the gap is almost always a misjudged trade-off rather than an unknown fact.

## Common pitfalls

The exam punishes solutions that technically work but require humans: if an option involves someone running a script on a schedule and another is event-driven, the event-driven one nearly always wins. Candidates also stumble on cross-account IAM details and on knowing which CodeDeploy strategies apply to which compute platform.
