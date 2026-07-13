---
description: "Network Security is 14% of Network+ N10-009 — the smallest domain. Attacks, mitigations, and a preview of Security+."
---

## What this domain actually tests

The smallest domain on the exam, and effectively a preview of [Security+](/exams/comptia-security-plus). If you intend to take that next, the time you spend here pays twice.

**The concepts:** defence in depth (layered controls, so no single failure is fatal), **zero trust** (never trust, always verify; no implicit trust from network location), and least privilege.

**Authentication, authorisation, and accounting (AAA)** — *who you are*, *what you may do*, and *what you did*. **RADIUS** and **TACACS+** are the protocols; the tested difference is that **TACACS+ separates authentication, authorisation, and accounting** and encrypts the entire payload, while RADIUS encrypts only the password.

## The traps

**The attacks, paired with their mitigations** — because the exam asks them as pairs, not as definitions:

| Attack | What it is | Mitigation |
|---|---|---|
| **Rogue DHCP server** | An attacker hands out bad addresses and gateways | **DHCP snooping** |
| **ARP poisoning** | Attacker maps their MAC to the gateway's IP | **Dynamic ARP Inspection** |
| **VLAN hopping** | Traffic reaches a VLAN it should not | Disable auto-trunking, change the native VLAN |
| **MAC flooding** | Overflow the switch's CAM table so it floods traffic | **Port security** |
| **On-path (MITM)** | Traffic silently intercepted | TLS, certificate validation |
| **DDoS** | Overwhelm with traffic | Rate limiting, upstream scrubbing |
| **Evil twin** | A rogue AP impersonating a legitimate SSID | WPA3, wireless IPS, user awareness |

That table is most of the domain. Learn the *pairing*, because a question describing the symptom expects the mitigation, and vice versa.

**DHCP snooping and Dynamic ARP Inspection get confused.** Snooping stops a rogue *DHCP server*. DAI stops *ARP spoofing*. They are different attacks with similar-sounding switch features.

**Port security** limits which MAC addresses may use a switch port — it is the answer to both MAC flooding and to "stop people plugging unauthorised devices into the wall."

**Physical security counts.** Locked racks, badge access, mantraps, and cameras appear, and candidates find them easy to forget precisely because they are not technical.

## How to study it

Build the attack-to-mitigation table above and drill it in **both directions**: given the attack, name the control; given the control, name what it prevents. The exam asks both ways.

Then get the DHCP-snooping-versus-DAI distinction cold, since it is the pair most likely to trip you.

At 14% this is the smallest domain — around twelve questions — so do not over-invest. But note that almost everything in it reappears, expanded, on Security+. If that is your next exam, treat this domain as an early down payment rather than a chore.
