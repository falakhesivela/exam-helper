---
title: "AZ-104: The Domains That Fail Most Candidates (and How to Fix Them)"
description: "Azure Administrator candidates lose exams in the same three places: networking, identity edge cases, and case-study time management. Here's the repair plan."
slug: "az-104-domains-that-fail-candidates"
examCode: "AZ-104"
date: "2026-06-25"
---

The [AZ-104](/exams/az-104) has one of the highest "harder than I expected" ratings of any associate cert. Talk to people who failed a first attempt and the same three weaknesses come up again and again. If you fix these deliberately, you remove most of the exam's teeth.

## Failure point 1: Networking depth

Networking is both the heaviest-weighted domain and the one where portal-level familiarity isn't enough. The recurring killers:

- **NSG evaluation.** Rules apply at subnet and NIC level, evaluated by priority, and traffic must pass *both*. Exam questions show a rule table and ask whether a packet flows — practise reading them until it's mechanical.
- **VNet peering is not transitive.** Hub-and-spoke questions hinge on this. Spoke A cannot reach spoke B through the hub without a gateway or appliance routing between them.
- **Load balancer vs Application Gateway vs Front Door.** Layer 4 vs layer 7 vs global entry point. The question names a requirement (URL-based routing, TLS offload, global failover) and expects the exact right product.
- **Private endpoints vs service endpoints.** One gives the service a private IP in your VNet; the other keeps traffic on the backbone but the service stays public. Know which satisfies "no public network access" requirements.

The fix is a lab, not a chapter: build a hub with two peered spokes, deploy VMs, write NSG rules, and test what actually connects. Two evenings of this outperforms a week of reading.

## Failure point 2: Identity and governance edge cases

Everyone knows RBAC basics; the exam probes the edges. Dynamic group membership rules and what happens when attributes change. Which Entra ID licence unlocks which feature (self-service password reset, conditional access). The difference between Azure roles and Entra roles — and that Owner on a subscription grants nothing inside Entra ID itself. And the inheritance chain: a deny assignment or a lock at a parent scope wins arguments that RBAC seems to permit.

Drill these as flash-style questions. They're memorisable, they're stable across exam revisions, and they're exactly where "I basically know RBAC" candidates bleed points.

## Failure point 3: The clock, especially case studies

AZ-104 mixes standard questions with case studies — several screens of scenario documentation followed by a question block. The trap is reading the whole case study first, carefully, twice. By question 30 you're behind and rushing the networking questions you could have gotten right.

The technique: read the *questions* first, then scan the case study for exactly the facts they need. Most case-study questions use a fraction of the provided material; the rest is deliberate noise. Practise this on full-length timed mocks — pacing is a trainable skill, and an untimed 90% is worth less than a timed 75%.

## A four-week repair plan

If you've failed once or your practice scores are stuck: week 1, the networking lab above plus daily NSG/peering/load-balancer questions. Week 2, identity and governance drills. Week 3, storage (SAS tokens, replication, Azure Files identity access) and compute (scale sets, App Service plans). Week 4, timed full-length practice exams only — fresh questions each time, reviewing every miss by domain. When networking stops being your worst domain, you're ready to book again.
