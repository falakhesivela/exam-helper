---
description: "Networking Concepts is 23% of Network+ N10-009 — the biggest domain. The OSI model as a troubleshooting tool, subnetting at speed, and the port list."
---

## What this domain actually tests

The largest domain, and the foundation the other four stand on.

**The OSI model as a working tool**, not a mnemonic. You need to know which devices, protocols, and — crucially — **problems** live at each layer, because troubleshooting questions are frequently framed as *"at which layer is this issue?"*

| Layer | Lives here |
|---|---|
| **7** Application | HTTP, DNS, SMTP — the app itself |
| **6** Presentation | Encryption, encoding, compression |
| **5** Session | Session setup and teardown |
| **4** Transport | TCP/UDP, **ports**, segmentation |
| **3** Network | **IP, routers, packets** — routing and addressing |
| **2** Data Link | **MAC, switches, frames**, VLANs, ARP |
| **1** Physical | **Cables, connectors, signal** — is it plugged in |

Learn to place the **symptom**: a cable fault is Layer 1. A VLAN misconfiguration is Layer 2. A wrong default gateway is Layer 3. A blocked port is Layer 4.

## The traps

### Subnetting, and being slow at it

**Slow subnetting is the top exam-killer on Network+** — not *wrong* subnetting, **slow** subnetting. It turns your most reliable marks into a time sink, and then the clock beats you on the questions you actually found hard.

Use the **block-size method**. For a /26, the mask ends in .192, so the block is 256 − 192 = **64**. Subnets fall on .0, .64, .128, .192, and each broadcast is one below the next network.

**Worked example:** which subnet does `172.16.45.130/26` belong to? Block size 64 → blocks are 0–63, 64–127, **128–191**, 192–255. So: network **.128**, broadcast **.191**, usable **.129–.190**, **62 hosts**.

Ten problems a day, every day, from week one. Not a subnetting *week* — a subnetting *habit*.

### Ports, drilled in both directions

Around two dozen matter: 20/21 FTP, 22 SSH, 23 Telnet, 25 SMTP, 53 DNS, 67/68 DHCP, 69 TFTP, 80 HTTP, 110 POP3, 123 NTP, 143 IMAP, 161/162 SNMP, 389 LDAP, 443 HTTPS, 445 SMB, 514 Syslog, 636 LDAPS, 3389 RDP.

**Drill them both ways** — "what port is LDAP?" *and* "what runs on 389?" — because PBQs make you drag protocols onto port numbers and partial credit is not guaranteed. Practising in only one direction leaves you half-prepared, and it is a very common mistake.

**TCP versus UDP matters and is checked.** DNS uses UDP (falling back to TCP for large transfers). DHCP, SNMP, and Syslog are UDP. Anything needing reliable ordered delivery is TCP.

## How to study it

Treat subnetting and ports as **habits, not topics**. Ten subnetting problems and ten minutes of port flashcards, daily, from day one. By week four both are automatic, and you have banked the marks *and* the clock time.

Then drill the OSI model by **symptom placement** rather than by reciting the layers. Given "the user's cable is unplugged," "the VLAN is wrong," "the gateway is misconfigured" — name the layer. That is how the exam asks.

At 23%, this domain is the biggest on the paper, and it is almost entirely made of skills that reward drilling over understanding.
