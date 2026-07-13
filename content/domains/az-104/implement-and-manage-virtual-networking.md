---
description: "Virtual Networking is 20% of AZ-104 and the domain that fails the most candidates. NSG evaluation order, non-transitive peering, and the private-endpoint requirement."
---

## What this domain actually tests

**This is the domain that fails people.** If you over-study one area of AZ-104, make it this one — and the reason is that networking questions come down to specific behaviours you cannot reason your way to. You either know them or you guess.

## The traps

### VNet peering is not transitive

If spoke A peers with the hub, and the hub peers with spoke B, **spoke A cannot reach spoke B.** Peering is strictly point-to-point.

Hub-and-spoke questions hinge entirely on this. The fix — and therefore the exam answer — is a network virtual appliance or **Azure Firewall in the hub**, plus **user-defined routes** on each spoke pointing spoke-to-spoke traffic at it. If an option offers to "enable transitive peering," that setting does not exist.

This fact is remarkably persistent even in people who know they know it. It gets forgotten under time pressure.

### NSG evaluation is by priority, first match wins

Rules are evaluated **lowest priority number first**, and evaluation **stops at the first match**. NSGs are stateful, so return traffic is automatically allowed. They can apply at both subnet and NIC level, and traffic must pass **both**.

The exam shows you a rule table and asks whether a packet flows:

| Priority | Source | Port | Action |
|---|---|---|---|
| 100 | Any | 80 | Allow |
| 200 | Internet | Any | **Deny** |
| 300 | Internet | 8080 | Allow |

Does internet traffic reach port 8080? **No.** Rule 200 matches first and denies it. Rule 300 is dead code sitting beneath a broader deny. That pattern — a permissive rule buried under a broad deny — is the domain's signature trap.

Remember the **default rules** at the bottom, too: they allow VNet-inbound and load-balancer traffic and deny everything else inbound. If none of your rules match, the defaults decide.

### Private endpoints versus service endpoints

A **private endpoint** gives the PaaS service a **private IP inside your VNet**. The service can then be completely cut off from the public internet.

A **service endpoint** keeps traffic on the Azure backbone, but the service **still has a public endpoint**.

So when a requirement says **"no public network access,"** the answer is a private endpoint. A service endpoint does not satisfy it. This is worth several marks and it is routinely fumbled.

### Load Balancer versus Application Gateway

Layer 4 versus Layer 7. If the requirement mentions **path-based routing, SSL/TLS offload, or a WAF**, it is Application Gateway. If it is raw TCP/UDP throughput with no HTTP awareness, it is Load Balancer.

## How to study it

**Build the hub-and-spoke.** Two spokes, one hub, peered. Deploy a VM in each spoke and try to ping between them. Watch it fail. Then add a firewall and UDRs and watch it work.

Then break connectivity with an NSG and use **Network Watcher's IP flow verify** and **effective security rules** to find out *which rule* blocked it. Those are the exact tools the exam reaches for, and using them once teaches you more than a week of reading.

Two evenings of this removes most of the exam's teeth.
