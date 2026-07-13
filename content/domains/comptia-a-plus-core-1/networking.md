---
description: "Networking is 20% of A+ Core 1 — a preview of Network+ at shallower depth. Ports, Wi-Fi bands, and SOHO router configuration."
---

## What this domain actually tests

A preview of [Network+](/exams/comptia-network-plus), at a much shallower depth. You need recognition and basic configuration, not subnetting mastery.

**Common ports** are the core of it, and they are pure recall — which makes them free marks:

| Port | Protocol | | Port | Protocol |
|---|---|---|---|---|
| 20/21 | FTP | | 143 | IMAP |
| 22 | SSH | | 443 | HTTPS |
| 23 | Telnet | | 445 | SMB |
| 25 | SMTP | | 3389 | RDP |
| 53 | DNS | | 137–139 | NetBIOS |
| 67/68 | DHCP | | 161 | SNMP |
| 80 | HTTP | | 389 | LDAP |
| 110 | POP3 | | 427 | SLP |

Know **TCP versus UDP** for each. DNS and DHCP use UDP; anything needing reliable ordered delivery uses TCP.

## The traps

### Wi-Fi bands and the trade-off

This is the most commonly misremembered part of the domain, and the logic is simple once stated:

- **2.4 GHz** — **travels further**, penetrates walls better, but is **slower** and more congested (only three non-overlapping channels: 1, 6, 11).
- **5 GHz** — **faster**, more channels, less interference, but **shorter range** and worse through walls.
- **6 GHz** (Wi-Fi 6E) — fastest, least congested, shortest range.

The exam gives you a scenario — "users at the far end of the building have a weak signal" — and expects you to reason with the trade-off. Longer range means 2.4 GHz. Higher speed means 5 GHz.

Know the standards too: **802.11n** (both bands), **802.11ac** (5 GHz only), **802.11ax / Wi-Fi 6** (both, faster, better in crowds).

### DHCP and DNS at a concept level

**DHCP** hands out IP addresses automatically. **DNS** resolves names to IP addresses. A machine with a `169.254.x.x` address (**APIPA**) failed to reach a DHCP server — that is a diagnostic gift, and it appears.

If a user can reach a site by IP address but not by name, it is **DNS**. That symptom-to-cause mapping is examined.

### SOHO router configuration

Port forwarding, DHCP reservations, SSID and wireless security (**WPA2 versus WPA3** — always pick the newer), changing default credentials, and firmware updates. Basic, practical, and directly asked.

## How to study it

Drill the port list as flashcards **in both directions** — "what port is RDP?" *and* "what runs on 3389?" — because performance-based questions make you match protocols to numbers and partial credit is not guaranteed.

Then log into a home router and actually look at the settings. Set up port forwarding. Change the wireless security mode. Twenty minutes of this makes the SOHO questions concrete.

At 20% this domain is worth roughly eighteen questions, and a large share of them are pure recall. It also builds the foundation for Network+ later, so time spent here pays twice.
