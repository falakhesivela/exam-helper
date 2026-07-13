---
description: "Security Architecture is 18% of Security+ SY0-701 — zero trust, segmentation, and knowing exactly what a firewall, IDS, IPS, WAF, and proxy each do."
---

## What this domain actually tests

Design and placement — where security controls sit, and what each one actually does.

**Know what each device is for, precisely.** This is the core of the domain and the source of most of its marks:

| Device | What it does |
|---|---|
| **Firewall** | Filters traffic by rule (ports, IPs, protocols) |
| **IDS** | **Detects and alerts.** Out of band. Does not stop anything. |
| **IPS** | **Detects and blocks.** Inline, in the traffic path. |
| **WAF** | Understands **HTTP**. Stops application-layer attacks (SQLi, XSS). |
| **Proxy** | Mediates requests — forward (outbound clients) or reverse (inbound to servers) |
| **Load balancer** | Distributes traffic across servers |

**Zero trust** is the headline concept: *never trust, always verify, assume breach*. No implicit trust based on network location. Verify every request, enforce least privilege, and segment aggressively.

## The traps

**IDS versus IPS is the domain's signature question.** The distinction is *inline versus out of band*:

- An **IDS** sits off to the side, watching a copy of the traffic. It tells you something happened. It cannot stop it.
- An **IPS** sits **in the traffic path**. It can drop the packet.

Questions describe wanting to **automatically stop** an attack rather than be told about it — that is an **IPS**. Questions worried about false positives blocking legitimate traffic are pointing at the *risk* of an IPS, which is a real trade-off and an examinable one.

**A firewall is not a WAF.** A traditional firewall filters by port and IP; it has no idea what SQL injection is. If the scenario mentions a web application and application-layer attacks, only a **WAF** answers it.

**Segmentation and microsegmentation.** Dividing the network so a breach in one area cannot spread. If a scenario describes limiting *lateral movement* after a compromise, it is segmentation.

**The cloud shared responsibility model** appears here too — who secures what, depending on IaaS, PaaS, or SaaS.

**Defence in depth** is layered controls, so no single failure is fatal. It comes up as a principle and as the reason an answer with multiple overlapping controls beats one with a single control.

## How to study it

Draw a network diagram from memory and place every device on it: where the firewall sits, where the IDS taps traffic, where the IPS sits inline, where the WAF sits in front of the web servers, where the reverse proxy goes. Placement *is* the domain.

Then write one sentence for each device that captures what makes it different from its nearest neighbour — not what it is, but what it is **not**. "An IDS is like an IPS but it cannot block." "A firewall is like a WAF but it cannot read HTTP."

At 18% this is a mid-sized domain built on clean, learnable distinctions. Get the device table cold and you have most of it.
