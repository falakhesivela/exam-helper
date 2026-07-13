---
title: "Network+ N10-009: How to Drill Subnetting and Ports Until They Stick"
description: "The two pure-skill areas of Network+ respond to drilling like nothing else on the exam. Here are the exact methods, with worked examples, that make them automatic."
slug: "network-plus-subnetting-and-ports"
examCode: "N10-009"
date: "2026-06-11"
updated: "2026-07-13"
---

Every [Network+](/exams/comptia-network-plus) candidate eventually discovers the same thing: most of the exam is understandable with normal study, but two areas — subnetting and port numbers — are pure *skills* that laugh at passive reading.

You cannot understand your way to a fast /27 calculation. You drill it, or it costs you marks and, worse, minutes you needed elsewhere. Here is how to drill both efficiently.

## Subnetting: learn one method, then run reps

Pick a single calculation method and stick to it. Switching methods mid-preparation resets your progress, and there is no prize for elegance. The **block-size** method is the fastest to execute under pressure.

### The method

1. **Memorise two lines.** The bit values: 128, 64, 32, 16, 8, 4, 2, 1. And the mask values each CIDR adds: /25 = .128, /26 = .192, /27 = .224, /28 = .240, /29 = .248, /30 = .252.
2. **Find the block size**: 256 minus the interesting octet of the mask. A /26 mask ends in .192, so the block size is 256 − 192 = **64**. Subnets therefore start at 0, 64, 128, 192.
3. **Locate your address in a block.** The block start is the **network address**. Block start + block size − 1 is the **broadcast address**. Everything between is usable. Usable hosts = block size − 2.

### Worked example

**Which subnet does 172.16.45.130/26 belong to?**

- /26 → mask .192 → block size 64.
- Blocks in the last octet: 0–63, 64–127, **128–191**, 192–255.
- 130 falls in the 128 block.
- **Network:** 172.16.45.128. **Broadcast:** 172.16.45.191. **Usable:** .129 to .190. **62 hosts.**

That is fifteen seconds of work once the method is automatic, and about ninety seconds the first few times. The gap between those two numbers is the entire reason to drill.

### Another, with a /28

**How many usable hosts on a /28, and what is the third subnet?**

- /28 → mask .240 → block size 16.
- Blocks: 0–15, 16–31, **32–47**, 48–63…
- Third subnet: network .32, broadcast .47, usable .33–.46. **14 usable hosts** (16 − 2).

### The drill schedule

**Ten problems a day, every day, from week one.** Not a subnetting *week* — a subnetting *habit*. By week four, standard problems take you fifteen seconds and you have banked both the marks and the clock time for harder questions.

Two exam-specific wrinkles to fold into your reps:

- **"Why can't host A ping host B?"** — the classic troubleshooting frame, where the real question is whether two addresses are on the same subnet. Given 192.168.1.100/26 and 192.168.1.200/26: the first is in block 64–127, the second in block 192–255. Different subnets. They need a router, and if the default gateway is wrong or missing, that is your answer.
- **VLSM questions** asking for the smallest subnet that fits N hosts. Remember the **−2** (network and broadcast). Need 50 hosts? A /26 gives 62 usable — that works. A /27 gives 30 — it does not.

## Ports: spaced repetition plus anchors

The port list is smaller than it feels. Around two dozen actually matter:

| Port | Protocol | | Port | Protocol |
|---|---|---|---|---|
| 20/21 | FTP | | 161/162 | SNMP |
| 22 | SSH / SFTP | | 389 | LDAP |
| 23 | Telnet | | 443 | HTTPS |
| 25 | SMTP | | 445 | SMB |
| 53 | DNS | | 514 | Syslog |
| 67/68 | DHCP | | 587 | SMTP submission |
| 69 | TFTP | | 636 | LDAPS |
| 80 | HTTP | | 1433 | SQL Server |
| 110 | POP3 | | 3306 | MySQL |
| 123 | NTP | | 3389 | RDP |
| 143 | IMAP | | | |

Two techniques make them stick.

**Spaced repetition, ten minutes daily, in both directions.** "What port is LDAP?" *and* "what runs on 389?" The exam asks both ways, and PBQs in particular make you drag protocols onto port numbers where partial credit is not guaranteed. Practising in only one direction leaves you half-prepared and it is a very common mistake.

**Anchor the confusable ones with associations.** 22 and 23 are neighbours where the secure one (SSH) comes first — secure before insecure, low before high. Mail follows a story: you *send* on 25, and you *collect* on 110 (POP3, downloads and deletes) or 143 (IMAP, syncs and keeps). 69 TFTP is the "trivial" one: fewer features, and a lower, sillier number than its big brother FTP.

**Include TCP versus UDP in the drill**, because the exam checks. DNS uses UDP for queries and falls back to TCP for zone transfers and large responses. DHCP is UDP (67/68). SNMP is UDP (161/162). Syslog is UDP (514). Anything requiring reliable, ordered delivery — HTTP, HTTPS, SSH, SMTP, FTP — is TCP.

## Fold both into the real exam context

Drilling in isolation is step one. Network+ then wraps these skills inside scenarios, and a skill you have only practised in isolation tends to evaporate when it appears mid-paragraph.

So **from week three onward, get your reps through mixed exam-style questions rather than raw flashcards**: a subnetting calculation buried inside a troubleshooting stem, a port question inside a firewall-rule PBQ, a same-subnet check disguised as "user A can reach the server but user B cannot."

Fresh, generated practice questions are ideal here precisely *because* you cannot memorise your way through them. Each one forces the actual computation, which is exactly what exam day does. A recycled question bank lets you recognise the answer without doing the maths — which feels like progress and is the opposite of it.

## Why this is worth the effort

Slow subnetting is the top exam-killer on Network+. Not *wrong* subnetting — **slow** subnetting. It converts what should be your most reliable marks into a time sink, and then the clock beats you on the questions you actually found hard.

Handle these two areas as habits rather than topics, and the rest of [Network+ preparation](/exams/comptia-network-plus) — OSI reasoning, routing concepts, wireless standards, the troubleshooting methodology — gets the study time it needs, while the pure-skill questions become the most dependable marks on your scoresheet.
