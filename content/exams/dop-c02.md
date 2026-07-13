---
title: "AWS DevOps Engineer Professional (DOP-C02) Study Guide"
description: "A preparation guide for AWS's hardest operations exam: the six domains, how professional-level questions differ, the tie-breakers that decide them, and how to study."
examCode: "DOP-C02"
slug: "dop-c02"
updated: "2026-07-13"
faqs:
  - q: "How much harder is DOP-C02 than the associate exams?"
    a: "Considerably, and in a different way. The associate exams test whether you know what a service does. DOP-C02 gives you a working system, adds a requirement, and offers four solutions that would all technically work — then asks for the best one. The knowledge gap is smaller than the judgement gap, which is why real operations experience matters more here than study hours."
  - q: "Do I need an associate certification before DOP-C02?"
    a: "AWS no longer requires one, so you can sit it directly. Whether you should is another matter: the exam assumes everything on the Developer Associate as background and does not teach it to you. Most people who pass have either an associate cert or two years of real AWS operations behind them."
---

The AWS Certified DevOps Engineer – Professional is a genuinely hard exam. It assumes you can already do everything on the [Developer Associate](/exams/dva-c02) and asks you to automate it: multi-account deployments, self-healing infrastructure, compliance enforcement, and incident response — all expressed as long, dense scenarios with four plausible answers.

## Who should take it

AWS recommends two or more years of experience provisioning and operating AWS environments. Take that seriously: professional-level questions test judgment built from real operations, not memorised facts. The typical successful candidate holds the Developer or SysOps associate cert and works with CI/CD and infrastructure-as-code daily.

## How the exam is scored

75 questions in 180 minutes, scored 100–1,000 with a 750 pass mark. Three hours sounds generous, but the stems are long — often a full paragraph plus four multi-line answers — so the time pressure is real. Budget roughly two minutes per question and flag anything that takes longer.

Expect real fatigue at the ninety-minute mark. This is the exam where stamina is a skill, and the only way to build it is to sit full-length timed mocks before the real thing.

## What makes professional questions different

Associate questions ask *what* a service does. Professional questions give you a working system and a new requirement — "deployments must roll back automatically when errors exceed 1%", "all accounts must block public S3 buckets" — and ask for the *best* implementation among several that would work.

Because every option works, you need tie-breakers. These are the ones that decide most DOP-C02 questions, roughly in order of how often they apply:

1. **Event-driven beats scheduled.** If one option triggers on an EventBridge event and another runs a cron job or a script every fifteen minutes, the event-driven one wins almost every time. Polling is the wrong answer by default.
2. **Managed beats custom.** A Config rule with an SSM Automation remediation beats a Lambda someone wrote to do the same thing.
3. **Least operational overhead.** If a solution needs a human to run something, it loses.
4. **Preventive beats detective.** An SCP that *stops* the bad thing beats a Config rule that *reports* it after the fact — unless the question explicitly asks for detection or audit.
5. **Smallest blast radius.** Between two automations, prefer the one that fails safely and affects less.

Internalise those five and a surprising number of questions stop being hard.

## The six domains, one by one

### SDLC Automation (22%)

The biggest domain. CodePipeline, CodeBuild, and CodeDeploy, but at scale: cross-account pipelines (which means a pipeline role in the tooling account assuming a deployment role in the target account — know that shape), manual approval actions, and automated test gates.

Know every deployment strategy and — this is what the exam actually tests — **which strategies exist for which compute platform**. Blue/green and canary work differently on EC2, ECS, and Lambda. Lambda and ECS shift *traffic* by weight (canary and linear via an alias or ECS deployment controller); EC2 blue/green swaps *instances* behind the load balancer. Questions describe the compute platform and the risk appetite and expect the right pairing.

Also: CodeDeploy lifecycle hooks and automatic rollback on a CloudWatch alarm, which is the standard answer to "roll back automatically when errors spike."

### Configuration Management and IaC (17%)

CloudFormation at scale. **StackSets** are the answer to "deploy this to every account in the organisation" — know that they can be organisation-managed via Organizations and deploy to OUs automatically. Nested stacks, custom resources (a Lambda that CloudFormation calls for something it can't do natively), change sets, and **drift detection**.

Know the update behaviours: some property changes are in-place, some cause interruption, and some force **replacement** (a new physical resource and a new ID). Questions ask what happens to your data when you change a property.

Then CDK and SAM, and the multi-account machinery: Organizations, Control Tower, and account factories.

### Security and Compliance (17%)

IAM at scale: **permission boundaries** (a ceiling on what a role can be granted — the answer to "let developers create roles without letting them escalate privilege"), SCPs (which *never grant* anything, only restrict what accounts can do), and cross-account roles.

The security services and what each is actually for: **GuardDuty** (threat detection from logs), **Security Hub** (aggregates findings across accounts and services), **Inspector** (vulnerability scanning of workloads), **Detective** (investigating an incident's root cause), **Macie** (finding sensitive data in S3). The exam gives you a goal and expects the right service; they are easy to confuse and easy marks once separated.

**Config with auto-remediation** — a Config rule detects non-compliance and an SSM Automation document fixes it — is the single most reusable pattern in this domain.

### Resilient Cloud Solutions (15%)

Multi-region and multi-AZ. The four DR patterns and their RTO/RPO ordering: backup and restore (cheapest, slowest), pilot light, warm standby, and multi-site active/active (fastest, most expensive). Questions give you an explicit RTO and RPO in minutes or hours and expect you to name the pattern that meets it *most cheaply* — both halves matter.

Data replication: S3 Cross-Region Replication, Aurora Global Database (sub-second replication, fast cross-region failover), and DynamoDB global tables (multi-region, multi-active).

### Monitoring and Logging (15%)

CloudWatch alarms, **composite alarms** (combine several alarms to cut noise), and anomaly detection. Centralised logging across accounts using CloudWatch Logs **subscription filters** feeding Kinesis Data Firehose — that is the canonical multi-account log-aggregation answer.

X-Ray for tracing, Synthetics canaries for proactive endpoint checks, and metric filters that turn a log pattern into a metric you can alarm on.

### Incident and Event Response (14%)

The glue domain. EventBridge rules for event-driven remediation, SSM Automation runbooks, Incident Manager, and AWS Health events. Fault injection with FIS for chaos testing.

Most questions here are really testing tie-breaker #1: something happened, and the right answer reacts to the event rather than polling for it.

## How to prepare

Give yourself eight to twelve weeks.

**Weeks 1–6 — build.** A cross-account CodePipeline that deploys to a second account. A Config rule with an SSM Automation remediation that actually fixes a non-compliant bucket. An EventBridge rule that triggers a runbook when an alarm fires. A CloudFormation StackSet rolled out to an OU. You will remember these patterns because you fought with them, and they are the exam's spine.

**Weeks 7–12 — drill and post-mortem.** Full-length, professional-difficulty practice questions, and an honest review of every miss. At this level the gap is almost always a *misjudged trade-off*, not an unknown fact — so when you get one wrong, the useful question is not "what didn't I know" but "which tie-breaker did I fail to apply."

## Common pitfalls

The exam punishes solutions that technically work but require humans. If one option has someone running a script on a schedule and another is event-driven, the event-driven one nearly always wins.

Beyond that: cross-account IAM details (which role assumes what, and where the trust policy lives), not knowing which CodeDeploy strategies apply to which compute platform, and treating SCPs as though they grant permissions — they never do; they only take away.

Finally, time and stamina. Many failures on DOP-C02 are not knowledge failures at all; they are people making poor decisions in the last forty minutes because they never practised sitting a three-hour exam.

## After you pass

Check the [official DOP-C02 page](https://aws.amazon.com/certification/certified-devops-engineer-professional/) for current pricing and the exam guide PDF.

This is a professional-level credential and it renews any associate certification you hold. From here, the Solutions Architect Professional is the natural companion, and the specialty exams (Security, Networking) go deeper into individual domains.
