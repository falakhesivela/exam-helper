---
description: "Network Implementation is 20% of Network+ N10-009 — routing, switching, wireless, and the appliances. The near-miss distractors that decide it."
---

## What this domain actually tests

Building the network: routing, switching, wireless, and the appliances that sit in the path.

**Routing.** Static, dynamic, and default routes. **OSPF versus BGP** at a concept level — the rule of thumb the exam wants: **OSPF runs *inside* your network** (an interior gateway protocol); **BGP runs *between* networks on the internet** (an exterior one). Also know **NAT and PAT**: PAT is what lets many private hosts share one public IP by tracking port numbers, and it is what your home router does.

**Switching.** VLANs (logical segmentation), **trunking** (carrying multiple VLANs over one link, 802.1Q), and **STP** — whose entire purpose is **preventing Layer 2 loops**. If a scenario describes a broadcast storm, the answer involves spanning tree.

**Wireless.** Standards, the band trade-off, channel planning, and **WPA2 versus WPA3** (always prefer the newer).

## The traps

**The near-miss distractor pairs.** Network+ is built on these, and they are where the marks quietly go:

| Pair | The difference |
|---|---|
| **Hub vs switch vs router** | Repeats to all ports (L1) / forwards by **MAC** (L2) / forwards by **IP** between networks (L3) |
| **STP vs RSTP** | Same job; **RSTP converges in seconds** rather than ~50 |
| **ARP vs RARP** | IP → MAC (ARP, the one you actually meet) vs MAC → IP (legacy) |
| **802.11ac vs ax** | ac is 5 GHz only; **ax (Wi-Fi 6)** works on both bands and performs far better in crowded environments |
| **Straight-through vs crossover** | Unlike devices (PC↔switch) vs like devices (switch↔switch) — largely obsolete thanks to auto-MDIX, still examined |
| **Single-mode vs multi-mode fibre** | Long distance, laser, expensive vs shorter distance, LED, cheaper |

**The 2.4 GHz versus 5 GHz trade-off** is reasoning, not recall: **2.4 GHz travels further and penetrates walls** but is slower and congested (only channels 1, 6, 11 do not overlap). **5 GHz is faster with more channels** but has shorter range. Scenarios describe a coverage or speed problem and expect you to pick accordingly.

**Load balancer versus proxy versus firewall.** Distributing traffic across servers versus mediating requests versus filtering by rule. A **reverse proxy** sits in front of servers; a **forward proxy** sits in front of clients.

## How to study it

Use **Packet Tracer** and build a small topology. One VLAN-and-trunking lab teaches more than a chapter of reading — create two VLANs, trunk them between switches, and watch what happens when the trunk is misconfigured.

Then take the distractor table above and, for each pair, write **one sentence that could only be true of one of them**. That exercise is what stops you hesitating between two plausible options under time pressure, which is exactly what this domain is designed to make you do.

At 20% this is a solid fifth of the exam, and it is the domain where hands-on time converts most directly into confidence.
