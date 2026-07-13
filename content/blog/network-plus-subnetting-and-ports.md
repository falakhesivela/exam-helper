---
title: "Network+ N10-009: How to Drill Subnetting and Ports Until They Stick"
description: "The two pure-skill areas of Network+ respond to drilling like nothing else on the exam. Here are the exact methods that make them automatic."
slug: "network-plus-subnetting-and-ports"
examCode: "N10-009"
date: "2026-06-11"
---

Every [Network+](/exams/comptia-network-plus) candidate eventually discovers the same thing: most of the exam is understandable with normal study, but two areas — subnetting and port numbers — are pure skills that laugh at passive reading. You can't understand your way to a fast /27 calculation. You drill it, or it costs you marks and minutes. Here's how to drill both efficiently.

## Subnetting: learn one method, then run reps

Pick a single calculation method and stick to it — switching methods mid-preparation resets your progress. The powers-of-two approach works well:

1. Memorise the line: 128, 64, 32, 16, 8, 4, 2, 1 — and the subnet mask values each CIDR bit adds: /25 = .128, /26 = .192, /27 = .224, /28 = .240, /29 = .248, /30 = .252.
2. For any address + CIDR, find the **block size** (256 minus the interesting octet of the mask). A /26 has block size 64, so networks start at 0, 64, 128, 192.
3. Your address falls in one of those blocks: the block start is the **network address**, block start + block size − 1 is the **broadcast**, and everything between is usable. Usable hosts = block size − 2.

That's the whole skill. What remains is speed, and speed comes only from volume: 10 problems a day, every day, from week one. Not a subnetting week — a subnetting *habit*. By week four, a question like "which subnet does 172.16.45.130/26 belong to?" takes fifteen seconds, and you've banked both the marks and the clock time for harder questions.

Two exam-specific wrinkles to include in your reps: identifying whether two hosts are on the same subnet (the classic "why can't A ping B" troubleshooting frame), and VLSM questions that ask for the smallest subnet fitting N hosts (remember the −2).

## Ports: spaced repetition plus stories

The port list is smaller than it feels — around two dozen matter: 20/21 FTP, 22 SSH (and SFTP), 23 Telnet, 25 SMTP, 53 DNS, 67/68 DHCP, 69 TFTP, 80 HTTP, 110 POP3, 123 NTP, 143 IMAP, 161/162 SNMP, 389 LDAP, 443 HTTPS, 445 SMB, 514 Syslog, 587 SMTP-submission, 636 LDAPS, 1433 SQL Server, 3306 MySQL, 3389 RDP.

Two techniques make them stick:

- **Spaced repetition**, ten minutes daily, in both directions — "what port is LDAP?" and "what runs on 389?". The exam asks both ways, especially in PBQs where you drag protocols onto port numbers and partial credit isn't guaranteed.
- **Anchor the confusable ones with associations.** 22 and 23 are neighbours where the secure one (SSH) comes first. Mail follows a story: send on 25, collect on 110 or 143. 69 TFTP is the "trivial" one — smaller number of features, memorable number.

Include TCP vs UDP in the drill: DNS uses both (53), DHCP is UDP (67/68), SNMP is UDP (161), and the exam checks.

## Fold both into the real exam context

Drilling in isolation is step one; Network+ wraps these skills in scenarios. So from week three onward, get your reps through mixed exam-style questions instead of raw flashcards — a subnetting calculation inside a troubleshooting stem, ports inside a firewall-rule question. Fresh, generated practice questions are ideal here precisely because you can't memorise your way through them; each one forces the actual computation, which is exactly what exam day does.

Handle these two areas as habits rather than topics, and the rest of [Network+ preparation](/exams/comptia-network-plus) — OSI reasoning, routing concepts, wireless standards — gets the study time it needs, while the pure-skill questions become the most reliable marks on your scoresheet.
