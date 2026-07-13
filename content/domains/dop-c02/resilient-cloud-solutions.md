---
description: "Resilient Cloud Solutions is 15% of the DOP-C02 — the four DR patterns against explicit RTO/RPO numbers, and the cross-region replication options."
---

## What this domain actually tests

Multi-region and multi-AZ architecture, and it is the domain where the exam gives you **numbers** and expects you to pick the pattern.

The four DR patterns, in ascending order of cost and descending order of recovery time:

1. **Backup and restore** — cheapest, slowest. Hours to days.
2. **Pilot light** — core data replicated, minimal infrastructure running, scale up on failover.
3. **Warm standby** — a scaled-down but *fully functional* copy running continuously.
4. **Multi-site active/active** — full capacity in both regions, near-zero recovery time, most expensive.

The question shape is consistent: a scenario states an RTO and RPO explicitly ("we can tolerate 30 minutes of downtime and 5 minutes of data loss") and asks for the solution.

## The traps

**The exam wants the *cheapest* option that meets the requirement, not the best one.** This is the trap that catches engineers. Multi-site active/active meets almost every RTO you will be given — and it is wrong whenever something cheaper also meets it. Read the RTO, find the cheapest pattern that clears it, and stop.

**RTO and RPO are different things and both matter.** RTO is how long you can be *down*. RPO is how much *data* you can lose. A solution can meet one and fail the other. Backup and restore might satisfy a generous RTO while blowing a tight RPO, because the last backup was six hours ago.

**Know the replication options and what they buy:**

- **S3 Cross-Region Replication** — object-level, asynchronous.
- **Aurora Global Database** — sub-second cross-region replication, fast promotion of a secondary. This is the answer when the requirement is a very low RPO on a relational database.
- **DynamoDB global tables** — multi-region, **multi-active** (you can write in both regions).

That "multi-active" property is unique and questions exploit it: if the requirement is to *write* in two regions simultaneously, global tables are the answer and Aurora Global Database is not.

**Route 53 health checks and failover routing** are how the switch actually happens. A DR design with no automated failover mechanism is incomplete, and the exam notices.

## How to study it

Make a table with the four patterns down the side and rough RTO/RPO ranges across the top. Then practise mapping requirements to patterns until it takes seconds — this is a lookup, not a reasoning exercise, and treating it as a lookup is what buys you time on exam day.

Then learn the three replication technologies by their *distinguishing property* rather than their description: Aurora Global for the lowest RPO, DynamoDB global tables for multi-active writes, S3 CRR for objects.

Finally, remember tie-breaker four from the exam as a whole: **automated failover beats a documented manual procedure**, every time. If one option has a human promoting a replica and another has Route 53 doing it on a health check, the human loses.
