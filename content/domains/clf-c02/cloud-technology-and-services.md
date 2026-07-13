---
description: "Cloud Technology and Services is 33% of the CLF-C02 — the service catalogue, and the biggest domain on the exam. What it tests, how deep to go, and how to study it."
---

## What this domain actually tests

The largest domain on the Cloud Practitioner exam, and the one people over-prepare for most badly.

It is the **service catalogue**, and what it wants is *recognition*, not architecture. You need to be able to say what each service is for in one line. That is genuinely the bar, and going deeper is wasted time you could have spent on the shared responsibility model.

The map you need:

**Compute** — EC2 (virtual machines you manage), Lambda (run code without managing servers), ECS and EKS (containers), Elastic Beanstalk (deploy an app and let AWS handle the plumbing).

**Storage** — S3 (objects), EBS (a disk attached to one EC2 instance), EFS (a filesystem shared by many), Glacier (archive).

**Databases** — RDS (managed relational), DynamoDB (managed NoSQL), Redshift (data warehouse), ElastiCache (in-memory cache).

**Networking** — VPC (your private network), Route 53 (DNS), CloudFront (CDN), Direct Connect (a dedicated line from your datacentre).

That is most of the domain.

## The traps

**CloudWatch versus CloudTrail.** The single most-missed pair on this exam. CloudWatch is metrics, logs, and alarms — *what is it doing?* CloudTrail is the API audit log — *who did what?* If a question mentions auditing, compliance, or "who deleted the bucket," it is CloudTrail.

**Global versus regional services.** IAM, Route 53, and CloudFront are **global**. Almost everything else is regional. Questions test this directly and it is free marks.

**Edge locations are not Availability Zones.** Any scenario about reducing latency for users around the world by caching content close to them is CloudFront and edge locations — not multi-region deployment, and not availability zones.

**Over-preparation.** If you find yourself reading about DynamoDB partition key design, you have overshot this exam by a very wide margin. Engineers routinely study CLF-C02 as though it were the Solutions Architect exam, burn a month, and then discover the real thing is asking them to identify what Amazon S3 is.

## How to study it

Work through the catalogue one category at a time — compute, then storage, then databases, then networking — and write **one line per service** describing its purpose. That document is your study material, and it should take an afternoon per category, not a week.

Then spend an hour in the free tier just clicking around. Launch an EC2 instance, put a file in an S3 bucket, look at the RDS console. You are not learning to build anything; you are attaching names to things so the vocabulary sticks, and an hour of this beats a day of reading.

Trust the level. Breadth, one line each, move on.
