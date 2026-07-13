---
title: "AZ-900 in One Week: A Realistic Study Plan for Beginners"
description: "A day-by-day plan to pass Azure Fundamentals in seven days, including the trick pairings Microsoft builds the exam around and the question formats that surprise first-timers."
slug: "az-900-study-plan-one-week"
examCode: "AZ-900"
date: "2026-06-29"
updated: "2026-07-13"
---

[Azure Fundamentals](/exams/az-900) is genuinely passable in a week for someone with basic IT literacy — it is an entry-level exam about concepts, not configuration. But "passable in a week" only works with a plan that matches the exam's actual weighting.

Here is a day-by-day version budgeting about 2–3 hours per day.

## Day 1: Cloud concepts (25% of the exam)

Start with the vocabulary the whole exam is written in: **IaaS vs PaaS vs SaaS** (with Azure examples of each — Virtual Machines, App Service, Microsoft 365), public vs private vs hybrid cloud, and the economic argument: **capital expenditure vs operational expenditure**, and consumption-based pricing.

Then the benefits list Microsoft loves, and — this is the part people skim and then lose marks on — learn the terms **precisely**, because the exam distinguishes ones that sound alike:

- **Scalability** — the ability to add capacity.
- **Elasticity** — adding and removing it *automatically*, in response to demand.
- **Agility** — how *fast* you can deploy new resources.
- **High availability** — staying up during a failure.
- **Disaster recovery** — coming back *after* one.

These are not just definitions to memorise. Day-one concepts appear inside questions on every other topic.

## Day 2: Azure architecture (part of the 35% domain)

**The resource hierarchy is the most important diagram in your week:**

**management groups → subscriptions → resource groups → resources**

Know what lives at each level, and that policy and access **inherit downward**. A resource belongs to exactly one resource group; a resource group to exactly one subscription. Draw this from memory until it is automatic, because the governance questions on day 5 all hang off it.

Then the physical side, and the distinction that catches the most people:

- **Region** — a geographic location.
- **Availability zone** — physically separate datacentres **inside** one region. Protects against a datacentre failure.
- **Region pair** — a second region hundreds of miles away that Azure pairs yours with. Protects against a **regional** failure.

Zones are *inside* a region. Pairs are *across* regions. Confusing the two is one of the most common losses on this exam.

## Day 3: Compute and networking services

You need recognition, not depth. Virtual Machines (IaaS), App Service (PaaS for web apps), Azure Functions (serverless), Container Instances and AKS, and Azure Virtual Desktop.

For networking: virtual networks, and **VPN Gateway vs ExpressRoute** — an encrypted tunnel *over* the public internet versus a private, dedicated circuit that never touches it. Plus DNS.

The typical question names a requirement and asks which service fits. Practise that mapping, not feature lists.

## Day 4: Storage and databases

Storage account services (Blob, Files, Queues, Tables), the access tiers — **hot** (frequent access), **cool** (infrequent: cheaper storage, higher access cost), **archive** (rare: cheapest, retrieval takes hours) — and what redundancy options like LRS and GRS protect against.

Then the database lineup at one line each: Azure SQL Database, Cosmos DB (globally distributed, multi-model), Azure Database for MySQL/PostgreSQL. Finish with the migration tools: Azure Migrate and Data Box.

## Day 5: Identity, security, and governance (20%)

The densest day, and the most heavily tested relative to its size.

**Microsoft Entra ID** — and know it is *identity*, not "Active Directory in the cloud." The exam tests that distinction. Then multi-factor authentication, **conditional access** (policies that grant or block based on signals like location, device, and risk), and role-based access control.

Then **the governance trio**, which is close to guaranteed marks:

| Tool | Controls |
|---|---|
| **RBAC** | **Who** can do things |
| **Azure Policy** | **What** can be deployed |
| **Resource locks** | Stop **even authorised users** from deleting or changing things |

Azure Policy versus RBAC is Microsoft's single favourite trick pairing on this exam. If the scenario is about *enforcing a standard on resources* ("all resources must be tagged"), it is Policy. If it is about *granting a person permission* ("Sam needs to restart VMs"), it is RBAC. They are not alternatives, and both will be offered as options.

Note also that a **lock beats RBAC** — even an Owner cannot delete through a `CanNotDelete` lock. That is exactly why the exam likes them.

## Day 6: Cost management and tooling

**Pricing Calculator** (estimates a *new* workload you haven't built) versus **TCO Calculator** (compares your *on-premises* cost against Azure). A classic exam pairing.

Cost Management for tracking spend, tags for organising it. Then the monitoring family, which is the exam's other favourite three-way confusion:

- **Azure Monitor** — *your resources'* metrics and logs.
- **Service Health** — *Azure's own* outages and planned maintenance.
- **Azure Advisor** — *recommendations* to improve cost, security, reliability, and performance.

Know which tool answers which question. All three appear regularly.

## Day 7: Practice, format training, and booking

Spend the final day entirely on practice questions.

**Microsoft's formats are the most varied in the industry** — drag-and-drop matching, hotspot dropdowns embedded mid-sentence, and true/false blocks — and familiarity with the format is worth real points on its own.

One format catches almost everyone the first time: Microsoft shows you **the same scenario three times with three different proposed solutions**. Candidates assume exactly one must be correct and start eliminating. **Each statement is scored independently.** More than one can be right. All three can be wrong. Read every one on its own merits.

Drill mixed sets until you are consistently above 85% on questions you have not seen, review every miss against days 1–6, and **book the exam while everything is fresh.**

Momentum is the entire point of the one-week approach. Do not let it evaporate into "I'll book it next month" — that is how a seven-day plan becomes a three-month one, and the material leaks out of your head at roughly the rate you put it in.
