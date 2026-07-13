---
description: "IP Services is 10% of the CCNA 200-301 — NAT, DHCP, NTP, syslog, and QoS. Small, mechanical, and easy marks."
---

## What this domain actually tests

The supporting services that make a network usable: NAT, DHCP, DNS, NTP, SNMP, syslog, and QoS.

It is only 10% of the exam, but it is **mechanical and quickly learned** — good value for the time.

**NAT and PAT.** Know the terminology, because the exam uses it precisely and it is genuinely confusing at first:

| Term | Means |
|---|---|
| **Inside local** | The private address of your host, as seen inside |
| **Inside global** | The public address your host is translated *to* |
| **Outside global** | The real public address of the remote host |
| **Outside local** | How the remote host appears inside your network |

**PAT** (NAT overload) is what lets many hosts share one public IP by tracking **port numbers**. It is what your home router does, and it is the common exam case. Read `show ip nat translations` and be able to explain a row.

## The traps

**Syslog severity levels, and which direction is worse.** They run **0–7**, and **lower is more severe**:

**0** Emergency, **1** Alert, **2** Critical, **3** Error, **4** Warning, **5** Notification, **6** Informational, **7** Debugging.

The counter-intuitive part — and the reason it is tested — is that **level 7 (debugging) is the *least* severe**, but configuring logging at level 7 produces the **most** output, because each level includes everything more severe than itself. Setting `logging trap 4` captures levels 0 through 4.

**QoS: shaping versus policing.** Both limit traffic rate, and they differ in what they do with the excess:

- **Shaping** **buffers** the excess and sends it later. Smooths traffic. Adds delay.
- **Policing** **drops** (or re-marks) the excess immediately. No delay, but you lose packets.

If a question mentions buffering or smoothing, it is shaping. If it mentions dropping, it is policing. Also know **marking** (DSCP values) and that voice traffic gets priority queuing.

**NTP matters more than it looks.** Without synchronised clocks, your logs are useless and certificate validation breaks. Questions about correlating events across devices point at NTP.

**DHCP on a router** — the `ip helper-address` command forwards DHCP broadcasts to a server on another subnet. If clients on a remote VLAN are not getting addresses, this is the usual answer.

## How to study it

Configure NAT in the lab and inspect `show ip nat translations` until the four address types make sense — that table is otherwise pure confusion, and five minutes of real output fixes it.

Then memorise the syslog severity ordering and the shaping-versus-policing distinction. Both are single facts, both are asked directly.

Ten percent of the exam for a few evenings of mechanical learning. Take the marks.
