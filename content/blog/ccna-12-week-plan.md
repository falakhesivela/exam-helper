---
title: "CCNA 200-301: A 12-Week Plan for Working Professionals"
description: "How to pass the CCNA while working full-time: a 12-week schedule at 8-10 hours a week, built around lab time and the exam's no-review format."
slug: "ccna-12-week-plan"
examCode: "200-301"
date: "2026-06-08"
---

The [CCNA](/exams/ccna-200-301) has a reputation for consuming people's lives, but the candidates who burn out are usually the ones without a schedule — studying reactively, re-reading chapters, and never getting enough lab time. Twelve weeks at 8–10 hours a week is enough for a working professional, provided the hours are structured. Here's the structure.

## The weekly rhythm

Before the schedule, the rhythm that makes it survivable: two weeknight sessions of about 90 minutes (one learning, one labbing), one longer weekend block of 4–5 hours, and 15 minutes of daily practice questions with your coffee. The daily questions are non-negotiable — they're what keeps week-2 material alive in week 10.

## Weeks 1–3: Fundamentals and subnetting

Ethernet, the TCP/IP model, cabling, and IPv4/IPv6 addressing. Subnetting gets special treatment: start daily subnetting reps in week 1 and never stop. The CCNA expects you to subnet *while thinking about something else* — mid-troubleshooting, mid-topology-analysis — and that only happens when the calculation is automatic. By week 3 you should be under 30 seconds for standard problems.

Set up Packet Tracer (free from Cisco) in week 1 and do every example hands-on, even trivial ones. CLI fluency compounds.

## Weeks 4–6: Switching

VLANs, trunking, inter-VLAN routing, EtherChannel, and spanning tree. This block is where lab discipline pays most: build a three-switch topology, create VLANs, trunk them, break the trunk native VLAN on purpose, and read what `show interfaces trunk` tells you. STP questions on the exam almost always show `show spanning-tree` output and ask you to identify the root bridge or why a port is blocking — output you'll read effortlessly if you've generated it yourself twenty times.

## Weeks 7–9: Routing, services, and ACLs

Static routing first, then OSPFv2 — configuration, neighbour states, and interpreting `show ip route` and `show ip ospf neighbor`. Then the services cluster (NAT, DHCP, NTP, DNS) and access control lists. ACLs deserve focused reps: standard vs extended, placement rules, and above all **wildcard masks**, which are not inverted subnet masks in your muscle memory until you've drilled them. Lab everything: configure NAT and watch translations with `show ip nat translations`.

## Weeks 10–11: Security, wireless, and automation

Port security, DHCP snooping, dynamic ARP inspection, WPA2/WPA3, and the automation domain — REST APIs, JSON, controller-based networking concepts, and configuration management tools at a recognition level. Working professionals consistently under-study automation because it's newer and less "networky"; it's also some of the easiest marks on the exam. Two solid evenings cover it.

## Week 12: Exam-format training

The CCNA's defining quirk: **you cannot return to a question once answered**. That kills the universal strategy of flagging and revisiting. Your final week trains for it — full-length timed mocks where you commit to every answer, building the discipline of deciding in 60–90 seconds and moving on. Never leave a question blank (there's no penalty for guessing), and if a question is a time pit, take your best elimination-based guess and release it.

Take at least two full timed mocks this week. If you're scoring comfortably above 85% on fresh questions with honest time pressure, book with confidence. Below that, extend two weeks and repair your weakest domain — usually OSPF verification or ACLs — rather than sitting the exam hoping.

## The mindset that finishes

Twelve weeks is long enough for life to interfere. Miss a session, and the plan absorbs it; miss a week, and you compress the remaining schedule rather than extending forever — an exam date that moves indefinitely is how CCNA attempts quietly die. Book the exam at the start of week 8, when you're deep enough to know your pace. A real date on the calendar finishes more CCNAs than any study resource ever written.
