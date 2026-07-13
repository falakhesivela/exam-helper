---
title: "CCNA 200-301: A 12-Week Plan for Working Professionals"
description: "How to pass the CCNA while working full-time: a 12-week schedule at 8-10 hours a week, built around lab time, wildcard-mask drills, and the exam's no-review format."
slug: "ccna-12-week-plan"
examCode: "200-301"
date: "2026-06-08"
updated: "2026-07-13"
---

The [CCNA](/exams/ccna-200-301) has a reputation for consuming people's lives, but the candidates who burn out are usually the ones without a schedule — studying reactively, re-reading chapters, and never getting enough lab time. Twelve weeks at 8–10 hours a week is enough for a working professional, provided the hours are structured.

Here is the structure.

## The weekly rhythm

Before the schedule, the rhythm that makes it survivable:

- **Two weeknight sessions of about 90 minutes.** One learning, one **labbing**. Not one long session that starts as labbing and becomes YouTube.
- **One longer weekend block of 4–5 hours**, for the topologies that need setting up.
- **15 minutes of practice questions daily**, with your coffee.

The daily questions are non-negotiable. They are what keeps week-2 material alive in week 10, and on a twelve-week plan that is the difference between passing and re-learning subnetting in November.

## Weeks 1–3: Fundamentals and subnetting

Ethernet, the TCP/IP model, cabling, and IPv4/IPv6 addressing.

**Subnetting gets special treatment: start daily reps in week 1 and never stop.** The CCNA expects you to subnet *while thinking about something else* — mid-troubleshooting, mid-topology-analysis — and that only happens when the calculation is automatic. By week 3 you should be under 30 seconds for standard problems.

Use the **block-size method**: for a /26 the mask ends in .192, so the block is 256 − 192 = 64, and the subnets fall on .0, .64, .128, .192. Each broadcast is one below the next network. Do not convert to binary every time; you do not have the seconds.

**Set up Packet Tracer in week 1** (it is free from Cisco) and do every example hands-on, even the trivial ones. CLI fluency compounds — the muscle memory you build typing `show ip route` in week 2 is what lets you read output at a glance in week 11.

## Weeks 4–6: Switching

VLANs, trunking, inter-VLAN routing, EtherChannel, and spanning tree.

This block is where lab discipline pays most. Build a three-switch topology. Create VLANs. Trunk them. Then **break the native VLAN on purpose** and read what `show interfaces trunk` tells you about the mismatch. Break it in a different way and read it again.

STP questions on the exam almost always show `show spanning-tree` output and ask you to identify the root bridge or explain why a port is blocking. That is output you will read effortlessly *if you have generated it yourself twenty times* — and will stare at blankly if you have only read about it.

The STP decision procedure, which is all you really need: lowest bridge ID (priority, then MAC) becomes root → every non-root switch picks one root port by lowest path cost → each segment picks one designated port → everything else blocks.

## Weeks 7–9: Routing, services, and ACLs

Static routing first, then **OSPFv2** — configuration, neighbour states, and interpreting `show ip route` and `show ip ospf neighbor`.

Do not just configure OSPF. **Break it.** Mismatch the area, then the hello/dead timers, then the subnet mask, then the authentication, and watch the adjacency fail differently each time. Exam questions show you two routers stuck in EXSTART or 2-WAY and expect you to say why. There is no way to learn that from a diagram.

Also drill the router's decision order, because it underpins a whole class of questions: **longest prefix match first**, then administrative distance (connected 0, static 1, eBGP 20, OSPF 110, RIP 120), then the protocol's own metric.

Then the services cluster (NAT, DHCP, NTP, DNS) and **access control lists**, which deserve focused reps because of one thing:

### Wildcard masks are not subnet masks

This is the most common technical error on the entire exam. A wildcard mask is effectively the **inverse**: a `0` bit means "must match," a `1` bit means "don't care."

| To match | Subnet mask | Wildcard mask |
|---|---|---|
| A single host (10.1.1.5) | 255.255.255.255 | **0.0.0.0** (or `host`) |
| A /24 network | 255.255.255.0 | **0.0.0.255** |
| A /26 network | 255.255.255.192 | **0.0.0.63** |
| Everything | — | **255.255.255.255** (or `any`) |

Drill this until the inversion is instinctive, and remember two more ACL facts the exam leans on: there is an **implicit `deny any`** at the end of every ACL, and rules are evaluated **top-down, first match wins** — so a permissive rule sitting above a restrictive one makes the restrictive one dead code.

Lab everything: configure NAT and watch translations appear with `show ip nat translations`.

## Weeks 10–11: Security, wireless, and automation

Port security, DHCP snooping, dynamic ARP inspection, WPA2/WPA3, and the automation domain — REST APIs, JSON, controller-based networking, and configuration-management tools at a recognition level.

**Working professionals consistently under-study automation** because it is newer and feels less "networky." It is also **10% of the exam** and some of the easiest marks on it — enough to fail you on its own if you skip it. You need to read a JSON blob and answer a question about it, know your HTTP verbs, and be able to say what Ansible and Terraform are *for* and how they differ. Two solid evenings cover it. Do not leave it as a weekend skim.

## Week 12: Exam-format training

The CCNA's defining quirk: **you cannot return to a question once answered.** That kills the universal strategy of flagging and revisiting, and it should reshape your final week.

Your last week trains for it: **full-length timed mocks where you commit to every answer and never look back.** Build the discipline of deciding in 60–90 seconds and releasing. Never leave a question blank — there is no penalty for guessing, and a blank is a guaranteed zero. If a question is a time pit, take your best elimination-based guess and let it go.

**Warm up on exam morning.** Do a handful of practice questions before you walk in. Slow starters get punished by the no-review rule, because the first ten questions are gone forever by the time your brain is properly online.

Take at least two full timed mocks this week. If you are scoring comfortably above 85% on **fresh** questions under honest time pressure, book with confidence. Below that, extend two weeks and repair your weakest domain — usually OSPF verification or ACLs — rather than sitting the exam and hoping.

## The mindset that finishes

Twelve weeks is long enough for life to interfere. Miss a session and the plan absorbs it. Miss a week and you *compress* the remaining schedule rather than extending forever — because an exam date that moves indefinitely is how CCNA attempts quietly die.

**Book the exam at the start of week 8**, when you are deep enough to know your pace. A real date on the calendar has finished more CCNAs than any study resource ever written.
