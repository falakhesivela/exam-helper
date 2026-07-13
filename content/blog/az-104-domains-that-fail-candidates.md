---
title: "AZ-104: The Domains That Fail Most Candidates (and How to Fix Them)"
description: "Azure Administrator candidates lose exams in the same four places: networking, identity edge cases, storage replication, and case-study time management. Here's the repair plan."
slug: "az-104-domains-that-fail-candidates"
examCode: "AZ-104"
date: "2026-06-25"
updated: "2026-07-13"
---

The [AZ-104](/exams/az-104) has one of the highest "harder than I expected" ratings of any associate certification. Talk to people who failed a first attempt and the same weaknesses come up again and again. If you fix these deliberately, you remove most of the exam's teeth.

The common thread: AZ-104 does not test concepts, it tests *specific behaviours*. You cannot reason your way to "VNet peering is not transitive" from first principles. You either know it or you don't — and the fastest way to know it is to have configured it and watched it fail.

## Failure point 1: Networking depth

Networking is both the heaviest-weighted domain and the one where portal-level familiarity is not enough. The recurring killers:

### NSG evaluation

Rules are evaluated **by priority, lowest number first, and the first match wins.** NSGs can apply at both the subnet and the NIC level, and traffic must pass **both**. They are stateful, so return traffic is automatically permitted.

Exam questions show you a rule table and ask whether a packet flows. Work down by priority and stop at the first match:

| Priority | Name | Source | Port | Action |
|---|---|---|---|---|
| 100 | Allow-HTTP | Any | 80 | Allow |
| 200 | Deny-Internet | Internet | Any | Deny |
| 300 | Allow-App | Internet | 8080 | Allow |

Does traffic from the internet reach port 8080? **No.** Rule 200 matches first and denies it. Rule 300 is dead code sitting below a broader deny. That pattern — a permissive rule buried under a broad deny — is the exam's favourite trap, and it is the same logic as a Cisco ACL.

Remember there are also **default rules** at the bottom that allow VNet-inbound and load-balancer traffic and deny everything else inbound. If nothing you wrote matches, the defaults decide.

### VNet peering is not transitive

If spoke A peers with the hub and the hub peers with spoke B, **spoke A cannot reach spoke B.** Peering is strictly point-to-point.

Hub-and-spoke questions hinge entirely on this. The fix — and therefore the correct exam answer — is a network virtual appliance or Azure Firewall in the hub, plus **user-defined routes** on each spoke pointing spoke-to-spoke traffic at it. If an option offers "enable transitive peering," it does not exist.

### Load Balancer vs Application Gateway vs Front Door

Layer 4 versus Layer 7 versus global entry point. The question names a requirement and expects the exact product:

- **URL/path-based routing, SSL offload, WAF** → Application Gateway (L7, regional)
- **Raw TCP/UDP throughput, low latency, no HTTP awareness** → Load Balancer (L4, regional)
- **Global failover, edge acceleration, multi-region entry** → Front Door

### Private endpoints vs service endpoints

A **private endpoint** gives the PaaS service a private IP *inside your VNet* — the service is reachable privately and can be fully cut off from the public internet. A **service endpoint** keeps traffic on the Azure backbone but the service still has a public endpoint.

So when a requirement says **"no public network access,"** the answer is a private endpoint. Service endpoints do not satisfy it. This distinction is worth several marks and it is routinely fumbled.

**The fix for all four is a lab, not a chapter.** Build a hub with two peered spokes, deploy VMs, write NSG rules, and test what actually connects. Then use Network Watcher's **IP flow verify** and **effective security rules** to find out *why* something was blocked — those are the tools the exam reaches for, and using them once teaches you more than reading about NSGs for a week. Two evenings of this outperforms a month of video.

## Failure point 2: Identity and governance edge cases

Everyone knows RBAC basics; the exam probes the edges.

- **The four core roles, and what separates them.** Owner (everything, including granting access), Contributor (everything **except** granting access), Reader, User Access Administrator (only granting access). "Contributor cannot assign roles" is a reliable exam fact and a reliable trap.
- **Azure roles vs Entra roles.** Azure roles control access to *resources*. Entra roles control access to *identity administration*. Being Owner on a subscription grants you nothing inside Entra ID itself.
- **Dynamic group membership** rules, what happens when a user's attributes change, and the fact that dynamic groups require a P1 licence.
- **Which Entra licence unlocks which feature** — self-service password reset, conditional access.
- **Inheritance and locks.** A resource lock at a parent scope wins arguments that RBAC appears to permit. Even an Owner cannot delete through a `CanNotDelete` lock. That is precisely why the exam likes them.

Drill these as flashcard-style questions. They are memorisable, stable across exam revisions, and exactly where "I basically know RBAC" candidates quietly bleed points.

## Failure point 3: Storage replication

A small topic that punches above its weight, because the exam asks it as a *requirement* and expects you to produce the acronym.

| Requirement | Answer |
|---|---|
| Survive a disk or rack failure | LRS |
| Survive a whole datacentre (zone) failing, within one region | ZRS |
| Survive an entire region failing | GRS (secondary copy, **not** readable) |
| Survive a region failing **and** read the data during the outage | RA-GRS |
| Zone redundancy in-region *and* geo-replication | GZRS / RA-GZRS |

The tested pattern: if the requirement says "regional outage," you need a **G**. If it also says "readable" or "read access during an outage," you need **RA-**. Learn to map requirement to acronym rather than memorising the acronyms in the abstract.

While you are here: **Azure Backup versus Azure Site Recovery.** Backup protects *data* so you can restore it. Site Recovery replicates *whole machines* so you can fail over to another region. One is backup, one is disaster recovery, and the exam checks that you know which requirement each solves.

## Failure point 4: The clock, especially case studies

AZ-104 mixes standard questions with **case studies** — several screens of scenario documentation followed by a question block. The trap is reading the whole case study first, carefully, twice. By question 30 you are behind and rushing the networking questions you could have got right.

**The technique: read the *questions* first, then scan the case study for exactly the facts they need.** Most case-study questions use a small fraction of the provided material; the rest is deliberate noise designed to consume your time.

Practise this on full-length timed mocks. Pacing is a trainable skill, and an untimed 90% is worth considerably less than a timed 75%.

## A four-week repair plan

If you have failed once, or your practice scores are stuck:

- **Week 1 — Networking.** The hub-and-spoke lab above, plus daily NSG, peering, and load-balancer questions until reading a rule table is mechanical.
- **Week 2 — Identity and governance drills.** The edge cases, as flashcards.
- **Week 3 — Storage and compute.** Replication mapping, SAS tokens, Azure Files identity access; scale sets and App Service plans.
- **Week 4 — Timed full-length practice only.** Fresh questions each time, reviewing every miss by domain, and practising the read-the-questions-first case-study technique under the clock.

**When networking stops being your worst domain, you are ready to book again.** That is the actual signal — not a target score, and certainly not "I've finished the course."
