---
description: "Security Fundamentals is 15% of the CCNA 200-301 — ACLs and wildcard masks, where the most common technical error on the whole exam lives."
---

## What this domain actually tests

Access control lists, port security, and Layer 2 hardening. And ACLs are where **the single most common technical error on the CCNA** lives.

## The traps

### Wildcard masks are not subnet masks

A wildcard mask is effectively the **inverse** of a subnet mask. A **`0` bit means "must match."** A **`1` bit means "don't care."**

| To match | Subnet mask | **Wildcard mask** |
|---|---|---|
| A single host (10.1.1.5) | 255.255.255.255 | **0.0.0.0** (or `host 10.1.1.5`) |
| A /24 network | 255.255.255.0 | **0.0.0.255** |
| A /26 network | 255.255.255.192 | **0.0.0.63** |
| A /30 network | 255.255.255.252 | **0.0.0.3** |
| Everything | — | **255.255.255.255** (or `any`) |

The quick method: subtract each octet of the subnet mask from 255.

Drill this until the inversion is instinctive. Candidates who "know" wildcard masks still invert them incorrectly under time pressure, and it is a completely avoidable loss.

### The implicit deny, and first-match-wins

Every ACL has an **implicit `deny any` at the end**. If you permit some traffic and forget to permit the rest, the rest is dropped.

ACLs are evaluated **top-down, and stop at the first match.** So a permissive rule placed *above* a restrictive one makes the restrictive one **dead code** that never executes. The exam shows you an ACL and asks what actually happens — work down the list and stop at the first match.

### Placement

- **Standard** ACLs filter by **source only** → place them **close to the destination** (because placing them near the source would block too much).
- **Extended** ACLs filter by source, destination, protocol, and port → place them **close to the source** (drop unwanted traffic early).

This rule gets reversed under pressure. Standard = destination. Extended = source.

### Layer 2 hardening

**Port security** (limit which MACs may use a port — stops MAC flooding and unauthorised devices). **DHCP snooping** (stops a rogue DHCP server). **Dynamic ARP Inspection** (stops ARP spoofing, and depends on the DHCP snooping binding table).

Snooping and DAI get confused: snooping stops a rogue *DHCP server*; DAI stops *ARP poisoning*.

## How to study it

Write ACLs in the lab, apply them **in the wrong direction**, and watch traffic you wanted get dropped. Then fix them. That mistake, made once with your own hands, is worth more than any amount of reading.

Then drill wildcard-mask conversions as flashcards — twenty of them, both directions — until the inversion is automatic.

At 15% this is a mid-sized domain, but ACL logic bleeds into the troubleshooting questions elsewhere on the exam. Getting it solid pays beyond its weighting.
