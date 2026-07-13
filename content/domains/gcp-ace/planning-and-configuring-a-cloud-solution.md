---
description: "Planning and Configuring a Cloud Solution is 22% of the GCP ACE — the database decision tree, storage class minimums, and auto versus custom mode VPCs."
---

## What this domain actually tests

Sizing and selection — and most of the domain's marks live in **the database decision tree**, because Google gives you more options than AWS does and the boundaries between them are examined.

| Requirement | Service |
|---|---|
| Relational, single region, standard SQL workload | **Cloud SQL** |
| Relational, **global**, horizontally scalable, strongly consistent | **Cloud Spanner** |
| Document NoSQL for app/mobile data, real-time sync | **Firestore** |
| Wide-column NoSQL, enormous scale, time-series or IoT | **Bigtable** |
| Analytics and warehousing over huge datasets | **BigQuery** |
| In-memory cache | **Memorystore** |

## The traps

**Cloud SQL versus Spanner is the boundary the exam pushes hardest.** Spanner is *not* the default answer just because it is impressive — it is expensive, and the exam knows it. Reach for Spanner **only** when the requirement genuinely says global scale **with** strong consistency and horizontal scaling. A regional relational database with normal load is Cloud SQL, and picking Spanner is a wrong answer that feels like a right one.

**Firestore versus Bigtable.** App data with queries and real-time sync (Firestore) versus enormous-scale key-based lookups, time-series, and analytics (Bigtable). If the scenario mentions IoT telemetry at massive volume, it is Bigtable.

**Storage classes: the trap is not retrieval time, it is minimum duration.** This catches every AWS engineer.

Google's cold tiers are **not Glacier**. Standard, **Nearline**, **Coldline**, and **Archive** all retrieve in **milliseconds**. What differs is the **minimum storage duration**:

- Nearline — **30 days**
- Coldline — **90 days**
- Archive — **365 days**

Delete or overwrite an object before its minimum and you are still charged for the full period. If you reach for "retrieval takes hours," you have imported an AWS assumption that is simply false here.

**Auto mode versus custom mode VPCs.** **Auto mode** creates a subnet in *every* region automatically, with predefined ranges. **Custom mode** gives you full control over which subnets exist and what ranges they use — and is what you want in production. If the requirement mentions controlling IP ranges or a specific network design, it is custom mode.

## How to study it

Build the database decision table as a single card and drill it against *requirements* rather than product names. Write ten one-line requirements and label each with a service. That is the exam's format.

Then write down the three storage minimum durations, because they are pure recall and they are free marks.

Finally, if you are coming from AWS, spend ten minutes deliberately listing where your instincts are wrong: cold storage is not slow, networks are global, there is no deny rule, and Spanner is not "just Aurora." That list is worth more to you than another chapter of documentation.
