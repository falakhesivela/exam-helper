---
description: "Describe Azure Architecture and Services is 35% of AZ-900 — the biggest domain. The resource hierarchy, the zones-versus-pairs distinction, and the core service catalogue."
---

## What this domain actually tests

The largest domain on the exam, and it splits cleanly into two halves: **where things live**, and **what things are**.

**The resource hierarchy is the most important diagram in your week:**

> **management groups → subscriptions → resource groups → resources**

Policy and access **inherit downward** through it. A resource belongs to exactly one resource group; a resource group belongs to exactly one subscription. Every governance question on this exam hangs off this structure, so draw it from memory until it is automatic — it will pay for itself twice over on day five.

**The service catalogue** is recognition-level only. Virtual Machines (IaaS), App Service (PaaS for web apps), Azure Functions (serverless), Container Instances (a single container, fast) and AKS (managed Kubernetes). Storage: Blob (objects), Files (SMB shares), Disks. Databases: Azure SQL Database (managed relational), Cosmos DB (globally distributed NoSQL).

## The traps

**Availability zones versus region pairs.** This is the most-missed distinction in the domain, and it is worth learning precisely:

- A **region** is a geographic location.
- **Availability zones** are physically separate datacentres **inside one region**. They protect you against a *datacentre* failure.
- A **region pair** is a second region hundreds of miles away that Azure automatically pairs yours with. It protects you against a *regional* failure.

Zones are *inside*. Pairs are *across*. If the requirement is surviving a whole region going down, zones are not enough.

**Availability sets versus availability zones.** A **set** spreads VMs across fault and update domains *within one datacentre* — it protects against rack and maintenance failures. **Zones** spread them across separate datacentres. Zones give the higher SLA, and the exam asks which SLA improvement comes from which.

**Storage tiers.** Hot (frequent access), cool (infrequent — cheaper storage, higher access cost), archive (rare — cheapest, and retrieval takes *hours*). The retrieval delay on archive is the tested detail.

**ExpressRoute versus VPN Gateway.** A private, dedicated circuit that never touches the public internet versus an encrypted tunnel *over* it. If the requirement mentions not using the public internet at all, it is ExpressRoute.

## How to study it

Spend a full session on the hierarchy alone and draw it repeatedly. Then one session per service category, writing a one-line purpose for each service — no deeper.

Then take the zones-versus-pairs distinction and write out, in your own words, what each protects against. If you can state confidently that a three-zone deployment does *not* survive a regional outage, you have the single most valuable fact in this domain.

At 35% of the exam this is roughly fourteen to twenty questions, and almost all of them are recognition rather than reasoning. Do not overthink it.
