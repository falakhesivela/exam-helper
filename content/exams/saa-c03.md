---
title: "AWS Solutions Architect Associate (SAA-C03) Study Guide"
description: "What the AWS SAA-C03 exam covers, how it's scored, the four domains in detail, and the service comparisons that decide most questions."
examCode: "SAA-C03"
slug: "saa-c03"
updated: "2026-07-13"
faqs:
  - q: "Is the SAA-C03 harder than the Cloud Practitioner?"
    a: "Substantially. Cloud Practitioner asks what a service is; the Solutions Architect Associate asks which of four plausible services you should choose given a cost, latency, or availability constraint. It is a reasoning exam, not a recall exam, and that is the step most candidates underestimate."
  - q: "How long does it take to prepare for the SAA-C03?"
    a: "Most candidates with some AWS exposure need 8 to 10 weeks at around 8 hours a week. If you are new to AWS entirely, budget 12 weeks and spend the first two on VPC fundamentals — almost everything else on the exam sits on top of networking."
---

The AWS Certified Solutions Architect – Associate is the most popular cloud certification in the world, and for good reason: it proves you can design resilient, secure, cost-optimised architectures on AWS, and it is the credential hiring managers most often list for cloud roles.

It is also widely misunderstood. Candidates prepare for it as though it were a memory test about AWS services, then fail because the exam almost never asks what a service does. It asks which service you should pick when two of them would work and one of them is cheaper.

## Who should take it

AWS recommends at least a year of hands-on experience designing solutions on AWS, but plenty of candidates pass with less by studying deliberately. It suits developers moving into architecture, sysadmins migrating to cloud, and anyone who wants a credible, broadly recognised cloud credential. If you have no AWS experience at all, consider starting with the [Cloud Practitioner](/exams/clf-c02) first — not because SAA-C03 requires it, but because it gets the vocabulary out of the way so you can spend your study time on design decisions instead of definitions.

## How the exam is scored

You'll answer 65 questions in 130 minutes — a mix of single-answer multiple choice and multiple-response questions. AWS scores on a scaled range of 100–1,000 and you need 720 to pass. Fifteen of the 65 questions are unscored pilot items, but you won't know which, so treat every question as real.

There is no penalty for a wrong answer, which has one important consequence: **never leave a question blank.** Flag it, guess, move on, and come back. A blank is a guaranteed zero; a guess between two plausible options is a coin flip you might win.

Two minutes per question sounds generous and isn't. Scenario stems run to five or six lines, and the multiple-response questions take twice as long as the rest. Bank time on the short questions.

## What the questions feel like

SAA-C03 questions are scenario-heavy. A typical stem describes a company, a workload, and a constraint — "lowest cost", "least operational overhead", "most highly available" — and asks you to pick the best design. Two answers are usually plausible; the qualifier in the last sentence decides between them.

The single most valuable habit you can build: **read the last sentence first.** The stem's final clause tells you which dimension is being optimised, and that dimension is the whole question. The same scenario with "most cost-effective" and "highest availability" has two different correct answers, and the distractors are built to punish you for optimising the wrong one.

Watch for these qualifiers specifically:

| Qualifier | What it usually rules out |
| --- | --- |
| "Least operational overhead" | Anything you have to patch, scale, or babysit — favours managed and serverless |
| "Most cost-effective" | Provisioned, always-on, and cross-AZ/cross-region data transfer |
| "Highest availability" | Single-AZ anything; favours Multi-AZ and health-checked failover |
| "Minimal application changes" | Rewrites — favours lift-and-shift over re-architecture |
| "Real time" / "sub-second" | Batch, Glacier retrieval, and anything eventually consistent |

## The four domains, one by one

### Design Resilient Architectures (30%)

The biggest domain, and the one that quietly contains networking. If your VPC knowledge is shaky, this domain will sink you and you will misdiagnose it as bad luck.

You need to be fluent in public versus private subnets, why a private subnet needs a NAT gateway to reach the internet outbound, and why a NAT gateway lives in a *public* subnet — this one detail is tested constantly and gets reversed under pressure. Know security groups (stateful, allow-only) versus NACLs (stateless, allow and deny, evaluated in rule order). Know when a VPC endpoint removes the need for a NAT gateway entirely, which is both a security answer and a cost answer.

Then layer availability on top: Auto Scaling groups across multiple AZs, an ALB with health checks, and Route 53 failover. Know the four disaster-recovery patterns in order of cost and RTO — backup and restore, pilot light, warm standby, multi-site active/active — because questions describe an RTO/RPO in words and expect you to name the pattern.

### Design High-Performing Architectures (28%)

Storage and databases. This is where the comparison tables below earn their keep.

For S3, know the storage classes and — more importantly — their *retrieval* characteristics, because that's what questions turn on. Standard-IA and One Zone-IA have a retrieval fee and a 30-day minimum. Glacier Instant Retrieval gives you milliseconds; Glacier Flexible gives you minutes to hours; Glacier Deep Archive gives you up to 12 hours. A question describing "archived data, rarely accessed, must be available within minutes if needed" is testing exactly this ladder.

For databases, the fork is almost always: does the access pattern need joins and flexible queries (RDS/Aurora), or is it key-value lookups at scale with a known access pattern (DynamoDB)? If the stem mentions "millisecond latency at any scale" or "millions of requests per second", it's DynamoDB. If it mentions "existing MySQL application", it's RDS or Aurora.

### Design Secure Architectures (24%)

IAM, and it is less about syntax than about a single principle: **roles, not keys.** If an answer option involves storing access keys on an EC2 instance, embedding credentials in code, or emailing keys to a partner, it is wrong. The right answer is an IAM role — an instance profile for EC2, a cross-account role for a partner, a service role for Lambda.

Beyond that: KMS for encryption at rest (and know that SSE-KMS gives you an audit trail and key rotation that SSE-S3 does not), Secrets Manager when you need automatic rotation of a database credential, and Parameter Store when you just need config and want it free. That last distinction — rotation means Secrets Manager — is a reliable one-line answer.

### Design Cost-Optimized Architectures (18%)

The smallest domain and the easiest to gain points in, because the rules are mechanical. Spot for interruptible and fault-tolerant work. Reserved Instances or Savings Plans for steady-state baseline. On-Demand for spiky and unpredictable. S3 Intelligent-Tiering when access patterns are *unknown* — that word is the trigger.

The subtle one is data transfer. Traffic into AWS is free; traffic out costs; traffic between AZs costs; traffic through a NAT gateway costs per GB. A question asking you to cut costs on a workload that pulls large objects from S3 through a NAT gateway is asking for a **gateway VPC endpoint**, which routes that traffic privately and free.

## The comparisons the exam keeps testing

The exam rarely asks "what does S3 do?" It asks you to choose. Build these tables and drill them until the choice is reflexive.

| Choose between | The deciding question |
| --- | --- |
| ALB vs NLB | HTTP routing by path/host (ALB) or extreme performance, static IP, TCP/UDP (NLB)? |
| S3 vs EFS vs FSx | Objects over HTTP (S3), shared POSIX filesystem for Linux (EFS), or Windows/SMB and Lustre (FSx)? |
| SQS vs SNS vs EventBridge | Decouple with a queue (SQS), fan out to many subscribers (SNS), or route events by content with schema (EventBridge)? |
| RDS Multi-AZ vs read replicas | Availability and automatic failover (Multi-AZ) or read scaling (replicas)? They solve different problems and questions conflate them deliberately. |
| Security group vs NACL | Instance-level and stateful (SG) or subnet-level, stateless, and able to explicitly *deny* (NACL)? Only NACLs can block a specific IP. |
| Secrets Manager vs Parameter Store | Does it need automatic rotation? Then Secrets Manager. Otherwise Parameter Store is cheaper. |
| NAT gateway vs VPC endpoint | Reaching the internet (NAT) or reaching an AWS service privately (endpoint — cheaper and more secure)? |

## A study plan that works

**Weeks 1–2 — Networking first.** Build a VPC by hand: two public subnets, two private, an internet gateway, a NAT gateway, route tables that actually work. Break it on purpose. Put an instance in the private subnet and figure out why it can't reach the internet. Nothing else on this exam makes sense until this does.

**Weeks 3–4 — Compute and resilience.** Put an application behind an ALB with an Auto Scaling group across two AZs. Terminate an instance and watch it come back. Learn the DR patterns and their RTO/RPO ordering.

**Weeks 5–6 — Storage and databases.** Drill the comparison tables above. Configure an S3 lifecycle policy. Create an RDS instance with Multi-AZ and force a failover.

**Week 7 — Security and cost.** IAM roles, KMS, SCPs at a high level. Then the pricing models.

**Week 8 — Timed practice only.** Full 65-question mocks under the clock. You are no longer learning AWS; you are learning to manage 130 minutes and to spot the qualifier.

Throughout: practise with **fresh, exam-style questions**, not dumps. Recycled question banks teach you the answer to a question you will never see again. AWS rotates its pool constantly, and the skill being measured is reasoning from a scenario you haven't met before — which is precisely the skill a dump prevents you from building.

## Exam-day tactics

Do a first pass and answer everything you know cold, flagging anything that takes more than 90 seconds. Most people finish the first pass in about 80 minutes with 12–15 flagged, which leaves a comfortable 50 minutes for the hard ones.

On the multiple-response questions, count the required selections and count them again. "Choose TWO" with three plausible options is the single most common careless loss on this exam, and partial credit does not exist — three correct out of a required two scores zero.

When you're down to two options and out of ideas, ask which one AWS would put in a whitepaper. The exam has a house style: managed over self-hosted, roles over keys, multi-AZ over single, and the boring, native, fully-managed answer over the clever one.

## Common pitfalls

Candidates most often fail by ignoring cost-optimisation qualifiers and choosing the technically strongest but most expensive option. Close behind: confusing S3 storage classes and their retrieval times, mixing up Multi-AZ with read replicas, forgetting that a NAT gateway sits in a public subnet, and misreading multiple-response questions.

There is also a subtler failure mode: knowing every service and still failing, because you practised recall instead of choice. If your practice consists of flashcards that ask "what is Aurora", you are not preparing for this exam. Practise questions that force a decision between two services under a constraint.

## Booking and next steps

The exam is delivered at Pearson VUE test centres or online with a proctor. Check the [official AWS exam page](https://aws.amazon.com/certification/certified-solutions-architect-associate/) for current pricing, scheduling, and the exam guide PDF, which is the authoritative statement of what's in scope.

Once you pass, the natural next steps are the [Developer Associate](/exams/dva-c02) to deepen your build skills, or the [DevOps Professional](/exams/dop-c02) once you have real automation experience behind you.
