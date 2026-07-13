---
description: "Design High-Performing Architectures is 28% of the SAA-C03 — storage and databases, and the service-choice questions that decide most of the exam. What it tests and how to study it."
---

## What this domain actually tests

Storage and databases, and it is the domain where the exam's real skill shows most clearly: **it almost never asks what a service does. It asks which one you should choose.**

For S3, the exam cares far less about what the storage classes *are* than about their **retrieval characteristics**, because that is what the questions turn on. Standard-IA and One Zone-IA have a retrieval fee and a 30-day minimum. Glacier Instant Retrieval returns data in milliseconds. Glacier Flexible takes minutes to hours. Glacier Deep Archive can take up to twelve. A stem describing "archived data, rarely accessed, but must be available within minutes when it is needed" is walking you up that exact ladder.

For databases, the fork is nearly always the same. Does the workload need joins, transactions, and flexible queries? That is RDS or Aurora. Is it key-value lookups at scale with a known access pattern? That is DynamoDB. The tells are reliable: "millisecond latency at any scale" or "millions of requests per second" means DynamoDB; "our existing MySQL application" means RDS.

The rest of the domain is caching (ElastiCache, DAX), EBS volume types, and the shared-filesystem question.

## The traps

**EFS vs EBS vs FSx.** One shared POSIX filesystem for many instances (EFS), one block volume attached to one instance (EBS), or Windows/SMB and Lustre workloads (FSx). Questions describe the *access pattern*, not the product, and expect you to map it.

**Choosing the strongest option rather than the required one.** A question asking for the most cost-effective way to store infrequently-accessed backups does not want S3 Standard, even though S3 Standard would certainly work. This domain overlaps heavily with cost optimisation, and the qualifier decides.

**S3 Intelligent-Tiering is triggered by one word.** When access patterns are described as *unknown* or *unpredictable*, that is the answer. When they are known, a lifecycle policy is cheaper.

**Read replicas do not provide high availability.** They scale reads. This confusion is set up deliberately and it appears in this domain as often as in the resilience one.

## How to study it

Build the comparison tables and drill them until the choice is reflexive rather than reasoned. The pairs worth the most: S3 vs EFS vs FSx, RDS vs Aurora vs DynamoDB, Multi-AZ vs read replicas, and ElastiCache Redis vs Memcached.

Then do the hands-on parts that stick: configure an S3 lifecycle policy that transitions objects through the storage classes, create an RDS instance with Multi-AZ enabled and force a failover, and watch what actually happens to the endpoint.

Finally, practise with questions that force a *decision* between two services under a constraint. Flashcards asking "what is Aurora?" are preparing you for a test this exam does not give.
