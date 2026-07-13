---
description: "Design Cost-Optimized Architectures is 18% of the SAA-C03 — the smallest domain and the easiest to win, because the rules are mechanical. What it tests and how to study it."
---

## What this domain actually tests

The smallest domain on the exam and, dependably, the easiest to gain marks in — because unlike architecture questions, the rules here are close to mechanical.

The purchasing models map to workload shapes and the mapping barely varies:

- **Spot** — interruptible, fault-tolerant work. Batch processing, CI workers, anything that can lose a node and retry. If the stem says the workload can tolerate interruption, this is almost certainly the answer.
- **Reserved Instances or Savings Plans** — steady-state, predictable baseline load running for a year or more.
- **On-Demand** — spiky, short-lived, or unpredictable workloads.
- **Dedicated Hosts** — usually a licensing requirement, not a cost one.

**S3 Intelligent-Tiering** has a one-word trigger: when access patterns are described as **unknown** or **unpredictable**, that is the answer. When they *are* known, a lifecycle policy is cheaper and is what the question wants.

## The traps

**Data transfer is the hidden cost, and the exam knows it.** Traffic into AWS is free. Traffic out costs. Traffic between Availability Zones costs. Traffic through a NAT gateway costs per gigabyte processed.

This produces the domain's signature question: a workload pulling large objects from S3 through a NAT gateway, and a requirement to cut costs. The answer is a **gateway VPC endpoint**, which routes that traffic privately and removes the NAT data-processing charge entirely. It is simultaneously the cheaper answer and the more secure one, which is why it shows up in the security domain too.

**The strongest architecture is the wrong answer.** This is the whole point of the domain. When a stem ends in "most cost-effective," the technically most impressive option is placed there specifically to catch engineers who optimise on instinct. Eliminate the over-engineered options *first*.

**Reserved capacity for a spiky workload is a trap in reverse.** Committing to a year of reserved instances for a workload that runs four hours a day is worse than On-Demand, and questions occasionally test whether you will over-apply the "reserved is cheaper" heuristic.

## How to study it

This domain rewards memorisation more than reasoning, so treat it that way and bank the marks. One evening on the purchasing models, one on the S3 storage-class economics, and one on data transfer.

Then internalise the single rule that governs the entire domain: **when a question names a dollar figure or uses the phrase "cost-effective," slow down and eliminate the expensive options before you evaluate anything else.** Candidates lose these marks not because they do not know the pricing models, but because they read the scenario, find the architecturally best answer, and never register that the last sentence changed the question.

At 18% of the exam, that is roughly twelve questions. They are among the most winnable on the paper.
