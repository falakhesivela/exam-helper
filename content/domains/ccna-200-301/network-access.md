---
description: "Network Access is 20% of the CCNA 200-301 — VLANs, trunking, EtherChannel, and reading show spanning-tree output to find the root bridge."
---

## What this domain actually tests

Switching: VLANs, trunking, inter-VLAN routing, EtherChannel, and **spanning tree** — plus wireless fundamentals.

**Spanning Tree** is best learned as a **decision procedure** you can execute, not a concept you can describe:

1. The switch with the **lowest bridge ID** (priority first, then MAC address) becomes the **root bridge**.
2. Every **non-root** switch selects exactly one **root port** — the one with the lowest path cost back to the root.
3. Each **segment** selects one **designated port**.
4. **Everything else blocks.**

The exam shows you `show spanning-tree` output and asks you to identify the root bridge, or explain why a particular port is blocking. Run that four-step procedure and the answer falls out.

## The traps

**The native VLAN mismatch.** On an 802.1Q trunk, frames in the **native VLAN are sent untagged**. If two ends of a trunk disagree about which VLAN is native, traffic leaks between VLANs — a security problem and a connectivity problem at once.

This is a favourite scenario, and the fix is to make the native VLAN match on both ends (and, as a hardening practice, to use an unused VLAN as the native one).

**Trunk versus access ports.** An access port carries one VLAN and sends untagged frames to an end device. A trunk carries many and tags them. Read `show interfaces trunk` and know what "allowed VLANs" means.

**EtherChannel needs consistent configuration on every member port** — same speed, duplex, VLAN configuration, and mode. A single mismatched port stops the bundle forming. Know the negotiation protocols (**LACP** is the open standard; **PAgP** is Cisco proprietary) and that mismatched modes on either end will fail.

**Priority is set in increments of 4096.** Lowering a switch's priority is how you *force* it to be root, and questions ask how to make a specific switch the root bridge — the answer is to set a lower priority, not to change its MAC.

**Inter-VLAN routing.** Router-on-a-stick (subinterfaces on one physical link) versus a Layer 3 switch with SVIs. Know both configurations by sight.

## How to study it

**Build a three-switch topology in Packet Tracer.** Create VLANs. Trunk them. Then **break the native VLAN on purpose** and read what `show interfaces trunk` tells you about the mismatch.

Then force a *different* switch to become root by changing its priority, and watch the port roles recalculate. Generating `show spanning-tree` output yourself twenty times is what makes reading it effortless on exam day — and staring at it blankly is exactly what happens to candidates who only read about STP.

At 20% this is a fifth of the exam, and it is almost entirely a lab domain. Hands on the CLI is the only way through it.
