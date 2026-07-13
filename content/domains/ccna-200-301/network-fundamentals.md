---
description: "Network Fundamentals is 20% of the CCNA 200-301 — cabling, topologies, and subnetting fast enough to do it while thinking about something else."
---

## What this domain actually tests

The groundwork: network components, topology architectures (two-tier, three-tier, spine-leaf), cabling and interfaces, and **addressing**.

And addressing means **subnetting**, which deserves to be treated as its own project.

## The traps

### You must subnet while thinking about something else

This is what separates CCNA subnetting from Network+ subnetting. The CCNA does not usually ask you a clean subnetting question. It asks you to **trace a packet through a topology**, or to work out **why host A cannot reach host B** — and subnetting is a sub-step you must perform *while* doing something harder.

That only works when the calculation is **automatic**. By week three you should be under 30 seconds for standard problems, and you get there by doing ten a day from week one.

Use the **block-size method** and stop converting to binary — you do not have the seconds. For a /27, the mask ends in .224, so the block is 256 − 224 = **32**. Subnets land on .0, .32, .64, .96, and each broadcast is one below the next network.

**Worked example:** `192.168.1.100/26`. Block size 64 → blocks 0–63, **64–127**, 128–191, 192–255. Network **.64**, broadcast **.127**, usable **.65–.126**.

Now: is `192.168.1.200/26` on the same subnet? Block 192–255 — **no**. Different subnet, needs a router. That is the *real* exam question, wearing a troubleshooting costume.

### IPv6 is not optional

Abbreviation rules (drop leading zeros; `::` replaces **one** run of consecutive zero groups, and only one). Address types: **global unicast** (2000::/3), **link-local** (`fe80::/10` — always present, used for neighbour discovery and OSPFv3 adjacencies), and unique local. Plus **EUI-64**, where the MAC is expanded into an interface ID with `fffe` inserted in the middle and the 7th bit flipped.

Candidates skimp on IPv6 because it feels secondary. It is not.

### Topologies

**Two-tier** (collapsed core: access + distribution), **three-tier** (access, distribution, core), and **spine-leaf** (every leaf connects to every spine — used in datacentres for predictable east-west latency).

## How to study it

**Ten subnetting problems a day, every day, from week one.** Not a subnetting *week* — a subnetting *habit*. This is the single highest-return habit available to a CCNA candidate.

Then give IPv6 its own dedicated sessions rather than tacking it on. Abbreviate twenty addresses by hand.

At 20% this domain is a fifth of the exam by weight — but its real weight is higher than that, because subnetting is load-bearing for the routing and troubleshooting questions in every other domain.
