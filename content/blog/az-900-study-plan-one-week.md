---
title: "AZ-900 in One Week: A Realistic Study Plan for Beginners"
description: "A day-by-day plan to pass Azure Fundamentals in seven days, including the question formats that surprise first-time Microsoft exam takers."
slug: "az-900-study-plan-one-week"
examCode: "AZ-900"
date: "2026-06-29"
---

[Azure Fundamentals](/exams/az-900) is genuinely passable in a week for someone with basic IT literacy — it's an entry-level exam about concepts, not configuration. But "passable in a week" only works with a plan that matches the exam's actual weighting. Here's a day-by-day version that budgets about 2–3 hours per day.

## Day 1: Cloud concepts

Start with the vocabulary the whole exam is written in: IaaS vs PaaS vs SaaS (and examples of each in Azure), public vs private vs hybrid cloud, and the economic argument — capital expenditure vs operational expenditure, consumption-based pricing. Then the benefits list Microsoft loves: high availability, scalability, elasticity, reliability, predictability. These aren't just definitions to memorise; day-one concepts appear inside questions on every other topic.

## Day 2: Azure architecture

The resource hierarchy is the most important diagram in your week: **management groups → subscriptions → resource groups → resources**. Know what lives at each level and how policy and access flow downward. Then the physical side: regions, region pairs, availability zones, and why a zone-redundant deployment survives a datacentre failure but not a regional one.

## Day 3: Compute and networking services

You need recognition, not depth: Virtual Machines (IaaS), App Service (PaaS for web apps), Azure Functions (serverless), Container Instances and AKS, and Azure Virtual Desktop. For networking: virtual networks, VPN Gateway vs ExpressRoute (internet vs private circuit), and DNS. The typical question names a requirement and asks which service fits — practise that mapping, not feature lists.

## Day 4: Storage and databases

Storage account services (Blob, Files, Queues, Tables), the access tiers — hot, cool, archive — and what redundancy options like LRS and GRS protect against. Then the database lineup at one line each: Azure SQL Database, Cosmos DB (global, multi-model), Azure Database for MySQL/PostgreSQL. Finish with the migration tools: Azure Migrate and Data Box.

## Day 5: Identity, security, and governance

The densest day, and the most heavily tested. Microsoft Entra ID (know it's identity, not "Active Directory in the cloud" — the exam tests the distinction), multifactor authentication, conditional access, and role-based access control. Then the governance trio and the differences between them: **RBAC** controls who can do things, **Azure Policy** controls what can be deployed, **resource locks** stop even authorised users from deleting things. That triple distinction is close to guaranteed marks.

## Day 6: Cost management and tooling

The pricing calculator (estimates new workloads) vs the TCO calculator (compares against on-premises) — a classic exam pairing. Cost Management for tracking spend, tags for organising it. Then the monitoring family: Azure Monitor (metrics/logs), Service Health (Azure's own status), and Azure Advisor (recommendations). Know which tool answers which question.

## Day 7: Practice, format training, and booking

Spend the final day entirely on practice questions. Microsoft's formats are the most varied in the industry — drag-and-drop matching, dropdown fill-ins, true/false blocks — and familiarity with the format is worth real points. Drill mixed sets until you're consistently above 85%, review every miss against days 1–6, and book the exam while everything is fresh. Momentum is the whole point of the one-week approach: don't let it evaporate into "I'll book it next month".
