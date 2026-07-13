---
title: "How to Pass the AWS Solutions Architect Associate (SAA-C03) in 8 Weeks"
description: "A week-by-week study plan for the SAA-C03, built around the domain weights, comparison drills, and hands-on labs that actually move your score."
slug: "how-to-pass-aws-saa-c03"
examCode: "SAA-C03"
date: "2026-07-13"
---

Eight weeks is the sweet spot for the [AWS Solutions Architect Associate](/exams/saa-c03): long enough to build real understanding, short enough that week-one material is still fresh on exam day. Here's a plan that has a realistic shape — around 8–10 hours a week — and front-loads the domains that decide your result.

## Weeks 1–2: Foundations and networking

Start with IAM, VPC networking, and EC2, because every scenario on the exam sits on top of them. Build a VPC by hand: public and private subnets across two Availability Zones, an internet gateway, a NAT gateway, and route tables you wrote yourself. Then launch instances into it and prove the routing works. Candidates who skip this keep guessing on networking questions; candidates who do it find those questions easy.

Finish week two with S3 in depth — storage classes, lifecycle policies, encryption options, and versioning. S3 is the single most-tested service on the exam.

## Weeks 3–4: The resilient and high-performing core

Now the load-bearing services: ELB (know when ALB vs NLB), Auto Scaling, RDS and Aurora, DynamoDB, ElastiCache, and the messaging trio of SQS, SNS, and EventBridge. This is where you should start building comparison tables, because the exam tests boundaries between services, not services in isolation:

| Decision | The line that divides them |
|---|---|
| SQS vs SNS | Queue one consumer pulls vs fan-out push to many |
| RDS vs DynamoDB | Relational queries and joins vs key-value at any scale |
| EFS vs EBS vs FSx | Shared POSIX vs single-instance block vs Windows/Lustre |
| ALB vs NLB | HTTP routing rules vs extreme TCP performance and static IPs |

Do a lab here too: an Auto Scaling group behind an ALB, with a scaling policy you trigger deliberately.

## Weeks 5–6: Security, cost, and the long tail

Cover KMS, Secrets Manager, GuardDuty, WAF, and CloudTrail vs CloudWatch vs Config — a trio the exam loves to shuffle. Then the cost domain: S3 storage class economics, EC2 purchasing options (Spot vs Reserved vs Savings Plans), and data transfer costs. Cost questions are the easiest marks on the exam once you internalise one rule: when the question says "most cost-effective", eliminate the over-engineered options first.

Spend the rest of these weeks on the long tail — Route 53 routing policies, CloudFront, Global Accelerator, Kinesis, and the container options — at a "what is it and when do I pick it" level.

## Weeks 7–8: Practice exams and repair

Switch entirely to practice mode. Take a full-length, timed 65-question exam at the start of week seven, then spend the week repairing your two weakest domains. Repeat in week eight. Two rules make this phase work:

1. **Only use fresh questions.** If you've seen a question before, it measures memory, not readiness. Prepa generates new exam-style questions each session precisely to keep this signal honest.
2. **Review every question, including the ones you got right.** If you guessed correctly, that's a gap wearing a disguise.

You're ready to book when you consistently score 80%+ on questions you've never seen, with no domain below 70%.

## Exam-day tactics

Read the last sentence of each scenario first — it contains the constraint ("MOST cost-effective", "LEAST operational overhead") that decides between the two plausible answers. Flag anything that takes more than two minutes and come back. And trust the preparation: if you followed the plan above, the exam will feel like one more practice session.
