---
description: "Design Resilient Architectures is 30% of the SAA-C03 — the biggest domain, and the one that quietly contains all the VPC networking. What it tests, the traps, and how to study it."
---

## What this domain actually tests

This is the largest domain on the exam, and the thing candidates miss about it is that **it quietly contains all of the networking**. There is no separate VPC domain. If your subnetting, routing, and gateway knowledge is shaky, it surfaces here — and people misdiagnose the resulting low score as bad luck rather than a networking gap.

The domain is really two skills stacked. First, can you build a correct VPC? Second, can you make what runs inside it survive failure?

On the VPC side, the exam wants you fluent in public versus private subnets, and — this is the detail it returns to over and over — **why a NAT gateway lives in a *public* subnet** while serving instances in private ones. That fact gets reversed under pressure more than any other on the exam. It also wants security groups (stateful, allow-only) versus NACLs (stateless, evaluated in rule order, and the only one that can explicitly *deny* a specific IP).

On the resilience side: Auto Scaling groups across multiple Availability Zones, load balancers with health checks, and Route 53 failover. Then the four disaster-recovery patterns, which questions describe in prose and expect you to name.

## The traps

**The DR ladder, given as an RTO/RPO in words.** Learn the four patterns in order of cost and recovery speed — backup and restore, pilot light, warm standby, multi-site active/active. A question saying "we can tolerate a few hours of downtime and want to minimise cost" is asking for pilot light, not multi-site. The exam wants the *cheapest option that meets the requirement*, not the best one.

**Multi-AZ is not multi-Region.** An architecture spread across three Availability Zones does not survive a regional outage, and questions exploit the assumption that it does.

**Multi-AZ versus read replicas.** These solve different problems — availability with automatic failover versus read scaling — and the exam deliberately offers both. If the requirement is "survive a database failure," it is Multi-AZ. If it is "the reporting queries are slowing down the app," it is a read replica.

**A VPC endpoint often beats a NAT gateway.** When traffic is headed to an AWS service rather than the internet, an endpoint is more secure *and* cheaper. Cost and security answers converge here, which is why it appears in both this domain and the cost one.

## How to study it

Build a VPC by hand — not from a template. Two public subnets, two private, across two AZs. Internet gateway, NAT gateway, route tables you wrote yourself.

Then **break it deliberately**. Remove the NAT gateway's route and watch the private instance lose outbound access; now you understand that a subnet is "private" because of its route table, not its name. Put the NAT gateway in a private subnet by mistake and watch nothing work at all. Block traffic with a NACL and then with a security group, and feel the difference statefulness makes.

Two evenings of this converts the entire domain from memorisation into recognition. There is no substitute, and candidates who skip it keep guessing on networking questions for the rest of their preparation.
