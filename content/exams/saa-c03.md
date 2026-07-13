---
title: "AWS Solutions Architect Associate (SAA-C03) Study Guide"
description: "What the AWS SAA-C03 exam covers, how it's scored, and a preparation strategy built around the four official domains."
examCode: "SAA-C03"
slug: "saa-c03"
updated: "2026-07-13"
---

The AWS Certified Solutions Architect – Associate is the most popular cloud certification in the world, and for good reason: it proves you can design resilient, secure, cost-optimised architectures on AWS, and it is the credential hiring managers most often list for cloud roles.

## Who should take it

AWS recommends at least a year of hands-on experience designing solutions on AWS, but plenty of candidates pass with less by studying deliberately. It suits developers moving into architecture, sysadmins migrating to cloud, and anyone who wants a credible, broadly recognised cloud credential. If you have no AWS experience at all, consider starting with the [Cloud Practitioner](/exams/clf-c02) first.

## How the exam is scored

You'll answer 65 questions in 130 minutes — a mix of single-answer multiple choice and multiple-response questions. AWS scores the exam on a scale of 100–1,000 and you need 720 to pass. Fifteen of the 65 questions are unscored pilot items, but you won't know which, so treat every question as real.

## What the questions feel like

SAA-C03 questions are scenario-heavy. A typical stem describes a company, a workload, and a constraint — "lowest cost", "least operational overhead", "most highly available" — and asks you to pick the best design. Two answers are usually plausible; the qualifier in the last sentence decides between them. Train yourself to underline the constraint before reading the options.

## How to prepare

- **Anchor on the domain weights.** Secure and resilient architectures together make up more than half the exam. If your practice scores are weak there, nothing else compensates.
- **Learn services in comparison pairs.** The exam rarely asks "what does S3 do?" It asks S3 vs EFS vs FSx, ALB vs NLB, SQS vs SNS vs EventBridge, or which RDS/Aurora/DynamoDB option fits. Build comparison tables and drill them.
- **Do the work in a real account.** Build a VPC with public and private subnets, put an application behind an ALB with Auto Scaling, and configure an S3 lifecycle policy. Questions about NAT gateways and security groups become trivial once you've configured them yourself.
- **Practise with fresh, exam-style questions.** Recycled question dumps teach you answers, not reasoning — and AWS rotates its question pool constantly. Practise with questions you haven't seen so you learn to reason from the scenario.

## Common pitfalls

Candidates most often fail by ignoring cost-optimisation qualifiers (choosing the technically strongest but most expensive option), confusing S3 storage classes and their retrieval characteristics, and misreading multiple-response questions that require exactly two or three selections. Slow down on any question that names a dollar figure or the word "cost-effective".

## Booking and next steps

The exam is delivered at Pearson VUE test centres or online with a proctor. Once you pass, the natural next steps are the [Developer Associate](/exams/dva-c02) to deepen your build skills, or the [DevOps Professional](/exams/dop-c02) once you have automation experience.
