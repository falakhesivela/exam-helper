---
title: "CompTIA Network+ (N10-009) Study Guide"
description: "What the Network+ N10-009 exam covers: the five domains, the subnetting and port drills that decide it, the OSI model as a troubleshooting tool, and a study plan."
examCode: "N10-009"
slug: "comptia-network-plus"
updated: "2026-07-13"
faqs:
  - q: "Should I take Network+ or go straight to CCNA?"
    a: "Network+ is vendor-neutral, broader, and shallower; CCNA is Cisco-specific, harder, and far deeper on configuration. If you want networking as a career, the CCNA carries more weight with employers. If you need networking as a foundation for security or cloud, or you want a gentler on-ramp, Network+ is the better use of your time — and it maps directly onto Security+ afterwards."
  - q: "How much subnetting is on the Network+?"
    a: "Enough that being slow at it will cost you the exam. It appears directly, inside performance-based questions, and indirectly in troubleshooting scenarios. Drill until a /26 or /28 takes seconds. It is the single highest-return thing you can practise."
---

CompTIA Network+ validates vendor-neutral networking fundamentals: how networks are designed, addressed, secured, and troubleshot. N10-009 sits naturally between [A+](/exams/comptia-a-plus-core-1) and [Security+](/exams/comptia-security-plus) in the CompTIA path, and it is the certification that turns "I know computers" into "I understand how data actually moves."

## Who should take it

CompTIA recommends 9–12 months of networking experience plus A+ knowledge, but neither is enforced. Network+ suits helpdesk staff moving up, aspiring network and cloud engineers, and security-bound learners who want firmer footing before Security+. If you are committed to a Cisco environment specifically, compare it with the [CCNA](/exams/ccna-200-301), which is harder but deeper.

## How the exam is scored

Up to 90 questions in 90 minutes, scored 100–900 with a 720 pass mark. Alongside multiple choice you will get performance-based questions — dragging network devices into a topology, matching ports to protocols, or working through a subnetting exercise.

As with Security+, the PBQs arrive early and eat time. Skim them, do the obvious ones, flag the rest, clear the multiple choice where the marks are fast, and come back.

## The five domains, one by one

### Networking Concepts (23%)

The largest domain, and the foundation for the other four.

**The OSI model as a working tool**, not a mnemonic. You need to know which devices, protocols, and *problems* live at each layer, because troubleshooting questions are frequently framed as "at which layer is this issue?"

| Layer | Lives here |
| --- | --- |
| 7 Application | HTTP, DNS, SMTP — the app itself |
| 6 Presentation | Encryption, encoding, compression |
| 5 Session | Session setup and teardown |
| 4 Transport | TCP/UDP, ports, segmentation |
| 3 Network | IP, routers, packets — *routing and addressing* |
| 2 Data Link | MAC, switches, frames, VLANs, ARP |
| 1 Physical | Cables, connectors, signal — *is it plugged in* |

A cable fault is Layer 1. A VLAN misconfiguration is Layer 2. A wrong default gateway is Layer 3. A blocked port is Layer 4. Learn to place the *symptom*.

**Subnetting, cold.** CIDR notation, network and broadcast addresses, usable hosts, and VLSM. Use the block-size method: for a /27, the block is 32, so subnets fall on .0, .32, .64, .96 and so on, and each broadcast is one below the next network. Drill until a /26 or /28 takes seconds rather than minutes. This is the exam's biggest skill gap and the single best use of your practice time.

**Ports and protocols** — pure memorisation and therefore pure free marks:

| Port | Protocol | | Port | Protocol |
| --- | --- | --- | --- | --- |
| 20/21 | FTP | | 143 | IMAP |
| 22 | SSH / SFTP | | 161/162 | SNMP |
| 23 | Telnet | | 389 | LDAP |
| 25 | SMTP | | 443 | HTTPS |
| 53 | DNS | | 445 | SMB |
| 67/68 | DHCP | | 636 | LDAPS |
| 80 | HTTP | | 3389 | RDP |
| 110 | POP3 | | 123 | NTP |

Know TCP versus UDP for each. DNS and DHCP use UDP (DNS falls back to TCP for large transfers); anything needing reliability is TCP.

### Network Troubleshooting (24%)

Nearly a quarter of the exam and the most scenario-driven domain.

Learn CompTIA's troubleshooting methodology **in order**, because the exam tests the sequence explicitly: identify the problem → establish a theory of probable cause → test the theory → establish a plan of action → implement the solution → verify full functionality and implement preventive measures → document findings, actions, and outcomes.

The two things candidates get wrong: **documentation is last**, and you must **verify** before you document. If a question describes a fix that worked and asks what you do next, the answer is verify functionality, not "document it and close the ticket."

Know the tools and what each is actually for: `ping` (reachability), `traceroute`/`tracert` (path and where it dies), `ipconfig`/`ifconfig`, `nslookup`/`dig` (DNS resolution specifically), `netstat`, `arp`, and a cable tester versus a toner probe.

### Network Implementation (20%)

Routing (static, dynamic, default routes; OSPF versus BGP at a concept level — OSPF inside your network, BGP between networks on the internet), switching (VLANs, trunking, STP's purpose — preventing Layer 2 loops), wireless standards and channel planning, and the appliances: firewall, load balancer, proxy, IDS/IPS.

### Network Operations (19%)

The domain candidates skip because it "feels soft," and it is nearly a fifth of the exam — easily enough to swing a borderline result.

Monitoring (SNMP, NetFlow, syslog), documentation and diagrams, change management, SLAs, and disaster recovery: **RPO** (how much data you can afford to lose) versus **RTO** (how long you can afford to be down), and the site types — **hot** (fully running, switch over in minutes), **warm** (hardware and some data, hours), **cold** (an empty room with power, days).

### Network Security (14%)

The smallest domain. Defence in depth and zero trust, authentication and encryption basics, and common attacks with their mitigations: VLAN hopping, rogue DHCP servers (mitigated by DHCP snooping), ARP poisoning (dynamic ARP inspection), on-path attacks, and DDoS. Plus physical security and segmentation.

## The near-miss distractors

Network+ is built on pairs that look almost identical. These are where the marks quietly go:

| Confused pair | The difference |
| --- | --- |
| Hub vs switch vs router | Repeats to all ports (L1) / forwards by MAC (L2) / forwards by IP between networks (L3). |
| ARP vs RARP | IP → MAC (ARP, the one you'll actually see) vs MAC → IP (legacy). |
| STP vs RSTP | Same job; RSTP converges in seconds rather than ~50 seconds. |
| TCP vs UDP | Reliable, ordered, connection-oriented vs fast, fire-and-forget. |
| RPO vs RTO | How much data you lose vs how long you're down. |
| Straight-through vs crossover | Unlike devices (PC↔switch) vs like devices (switch↔switch), largely obsolete with auto-MDIX but still examined. |
| Single-mode vs multi-mode fibre | Long distance, laser, expensive vs shorter distance, LED, cheaper. |

## How to prepare

Plan five to eight weeks.

**Weeks 1–2 — Fundamentals and subnetting.** Everything else references them. Do not proceed until subnetting is fast.

**Weeks 3–4 — Implementation and operations.** Use Packet Tracer to build small topologies; one VLAN-and-trunking lab teaches more than a chapter of reading. Give the operations material real time rather than skimming it.

**Weeks 5–6 — Troubleshooting and security**, drilling the methodology order and the tools.

**Weeks 7–8 — Mixed practice.** Fresh questions daily, always reading the explanation for wrong *and* right answers, because Network+ is full of near-miss distractors and getting one right for the wrong reason teaches you nothing.

## Common pitfalls

Slow subnetting is the top exam-killer — it converts easy marks into time sinks and then the clock beats you.

Second is fuzzy port knowledge, which PBQs punish because they demand exact matches rather than recognition. Third is skipping network operations because it feels like paperwork.

And fourth, quietly: getting the troubleshooting methodology order wrong, particularly documenting before verifying.

## After you pass

Check the [official CompTIA Network+ page](https://www.comptia.org/certifications/network) for current pricing and the free exam objectives PDF, which is the definitive scope.

Network+ is valid for three years with continuing-education renewal. Most holders continue to [Security+](/exams/comptia-security-plus), which assumes and lightly re-tests this material, or go deeper into infrastructure with the [CCNA](/exams/ccna-200-301).
