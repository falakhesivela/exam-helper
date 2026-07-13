---
description: "IP Connectivity is 25% of the CCNA 200-301 — the biggest domain. The router's decision order, OSPF adjacency failures, and reading show output."
---

## What this domain actually tests

The largest domain on the exam: **routing**.

**The router's decision order** underpins a whole class of questions, and you should be able to recite it:

1. **Longest prefix match** — the most specific route wins, regardless of protocol.
2. **Administrative distance** — if two protocols offer the same prefix, the lower AD wins.
3. **Metric** — within one protocol, the better metric wins.

The administrative distances worth memorising: **connected 0, static 1, eBGP 20, OSPF 110, RIP 120.**

A /32 static route beats an OSPF /24 for that address — not because static has a lower AD, but because **longest prefix match is evaluated first**. That subtlety is examined.

## The traps

### OSPF adjacency failures

**OSPFv2 is the named protocol on the blueprint**, and the exam's favourite question shows two routers stuck in **EXSTART** or **2-WAY** and asks why.

Adjacency fails when any of these mismatch:

- **Area ID**
- **Hello and dead timers**
- **Subnet mask** on the shared link
- **Authentication**
- **MTU** (the classic cause of a stall in EXSTART)

Do not just *configure* OSPF in your lab — **break it, one variable at a time**, and watch the adjacency fail differently for each. There is no way to learn this from a diagram, and it is worth a meaningful number of marks.

Also know **DR/BDR election** (highest priority, then highest router ID) and that it happens on multi-access (broadcast) networks, not point-to-point links.

### Reading `show` output

Questions overwhelmingly present **command output** rather than prose. `show ip route`, `show ip ospf neighbor`, `show ip interface brief`. You need to read these at a glance — which is a skill built only by generating them yourself, repeatedly.

In `show ip route`, know what the codes mean (`C` connected, `S` static, `O` OSPF) and how to read the `[110/2]` bracket: **[administrative distance / metric]**.

### First-hop redundancy and NAT

**HSRP** gives hosts a virtual gateway IP that survives a router failure. And **NAT/PAT** — know inside local, inside global, and how to read `show ip nat translations`.

## How to study it

Lab OSPF between three routers, then **break each adjacency variable in turn**. Mismatch the timers. Mismatch the area. Mismatch the mask. Watch what each does. That single exercise probably repays more exam marks per hour than anything else in your preparation.

Then drill reading `show ip route` until the codes and the AD/metric bracket are instant.

At 25% this is the biggest domain on the CCNA — and it is the one where lab time and exam marks are most directly proportional.
