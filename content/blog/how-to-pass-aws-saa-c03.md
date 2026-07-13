---
title: "How to Pass the AWS Solutions Architect Associate (SAA-C03) in 8 Weeks"
description: "A week-by-week study plan for the SAA-C03, built around the domain weights, the comparison drills, the labs that matter, and a readiness test that tells you when to book."
slug: "how-to-pass-aws-saa-c03"
examCode: "SAA-C03"
date: "2026-07-13"
updated: "2026-07-13"
---

Eight weeks is the sweet spot for the [AWS Solutions Architect Associate](/exams/saa-c03): long enough to build real understanding, short enough that week-one material is still fresh on exam day. Here is a plan with a realistic shape — around 8–10 hours a week — that front-loads the domains which decide your result.

## What a study week actually looks like

Before the schedule, the rhythm that makes it survivable alongside a job:

- **Two weeknight sessions, ~90 minutes each.** One is learning (reading, video, notes). One is *building* — hands in the console.
- **One weekend block, 3–4 hours.** The bigger labs need uninterrupted time.
- **15 minutes of practice questions, daily.** Non-negotiable. This is what keeps week-2 material alive in week 8.

That last one is the habit people skip and then wonder why they have forgotten S3 storage classes by the time they sit the exam. Spaced retrieval beats re-reading by a wide margin, and it costs you a coffee break.

## Weeks 1–2: Networking, then S3

Start with IAM, VPC networking, and EC2, because every scenario on the exam sits on top of them.

**Build a VPC by hand.** Not from a template — by hand. Two public subnets and two private, across two Availability Zones. An internet gateway. A NAT gateway. Route tables you wrote yourself. Then launch an instance into a private subnet and prove it can reach the internet outbound but nothing can reach it inbound.

Then break it on purpose:

- Remove the NAT gateway's route and watch the private instance lose outbound access. *Now* you understand why the route table, not the subnet name, is what makes a subnet "private."
- Put the NAT gateway in the private subnet by mistake and watch nothing work. This is the single most-reversed fact on the exam — the NAT gateway lives in a **public** subnet.
- Block traffic with a NACL, then with a security group, and notice the difference: the security group is stateful (return traffic is automatically allowed), the NACL is not.

Candidates who skip this keep guessing on networking questions forever. Candidates who do it find those questions easy, and networking is folded into the 30% Resilient Architectures domain.

Finish week two with **S3 in depth** — storage classes, lifecycle policies, encryption options, and versioning. S3 is the single most-tested service on the exam.

## Weeks 3–4: The resilient and high-performing core

Now the load-bearing services: ELB, Auto Scaling, RDS and Aurora, DynamoDB, ElastiCache, and the messaging trio of SQS, SNS, and EventBridge.

This is where you start building **comparison tables**, because the exam tests boundaries between services, not services in isolation:

| Decision | The line that divides them |
|---|---|
| SQS vs SNS vs EventBridge | A queue one consumer pulls from vs fan-out push to many vs content-based routing with schemas |
| RDS vs DynamoDB | Relational queries and joins vs key-value lookups at any scale |
| RDS Multi-AZ vs read replicas | Availability with automatic failover vs read scaling — different problems, deliberately conflated |
| EFS vs EBS vs FSx | Shared POSIX filesystem vs one disk for one instance vs Windows/SMB or Lustre |
| ALB vs NLB | HTTP routing by path and host vs extreme TCP performance and static IPs |

**Lab:** an Auto Scaling group behind an ALB, spanning two AZs, with a scaling policy you trigger deliberately. Then terminate an instance and watch the group replace it. Ten minutes of that is worth an hour of reading about self-healing infrastructure.

## Weeks 5–6: Security, cost, and the long tail

Cover KMS, Secrets Manager, GuardDuty, WAF, and the CloudTrail vs CloudWatch vs Config trio the exam loves to shuffle. The one-liners:

- **CloudWatch** — metrics, logs, alarms. What is it *doing*?
- **CloudTrail** — API audit log. Who *did* what?
- **Config** — resource configuration history and compliance. What *changed*, and is it allowed?

Then the cost domain, which contains the easiest marks on the exam once you internalise one rule: **when the question says "most cost-effective", eliminate the over-engineered options first.** The technically strongest answer is very often the wrong one, and it is placed there specifically to catch people who optimise on instinct.

The cost rules are mechanical enough to memorise in an evening: Spot for interruptible work, Reserved Instances or Savings Plans for steady baseline, On-Demand for spiky and unpredictable, Intelligent-Tiering when access patterns are **unknown** (that word is the trigger). And the one people miss: a **gateway VPC endpoint** removes NAT gateway data-processing charges for S3 and DynamoDB traffic — it is simultaneously the security answer and the cost answer.

Spend the rest of these weeks on the long tail — Route 53 routing policies, CloudFront, Global Accelerator, Kinesis, and the container options — at a "what is it and when do I pick it" level. Do not go deep. The long tail is worth a handful of marks and it is not where your remaining time earns the most.

## Weeks 7–8: Practice exams and repair

Switch entirely to practice mode. Take a full-length, timed, 65-question exam at the start of week seven, then spend the week repairing your two weakest domains. Repeat in week eight.

Two rules make this phase work:

1. **Only use fresh questions.** If you have seen a question before, it measures memory, not readiness — and it will flatter you. AWS rotates its pool constantly, so the skill being tested is reasoning about a scenario you have not met. Practising on a memorised bank actively prevents you from building it.
2. **Review every question, including the ones you got right.** If you guessed correctly, that is a gap wearing a disguise. The useful question after a mock is not "what did I get wrong" but "which ones did I not *know*."

### The readiness test

You are ready to book when all three are true:

- You consistently score **80%+ on questions you have never seen**.
- **No single domain is below 70%.** The exam is scaled across domains; a catastrophic weakness in Secure Architectures is not offset by brilliance in cost.
- You can finish 65 questions in **110 minutes**, leaving 20 minutes of slack. If you are only passing by using every second, you have no margin for a bad day.

If you are stuck at 70%, the problem is almost never breadth. It is that you are learning services instead of *choices*. Go back to the comparison tables.

## Exam-day tactics

**Read the last sentence of each scenario first.** It contains the qualifier — "MOST cost-effective", "LEAST operational overhead", "highest availability" — that decides between the two plausible answers. The same scenario with two different qualifiers has two different correct answers, and the distractors exist to punish you for optimising the wrong dimension.

**Do a first pass and flag anything over 90 seconds.** Most people clear the first pass in about 80 minutes with 12–15 flagged, leaving a comfortable 50 minutes for the hard ones.

**Count the required selections on multiple-response questions, then count again.** "Choose TWO" with three plausible options is the most common careless loss on this exam, and there is no partial credit — three correct out of a required two scores zero.

**Never leave anything blank.** There is no penalty for a wrong answer. A blank is a guaranteed zero; a coin flip between two plausible options is a coin flip you might win.

And when you are down to two and out of ideas, ask which one AWS would put in a whitepaper. The exam has a house style: managed over self-hosted, roles over keys, multi-AZ over single-AZ, and the boring native answer over the clever one.

If you followed the plan, the exam should feel like one more practice session. That feeling is the point — it means the preparation did its job.
