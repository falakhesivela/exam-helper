---
description: "Communication and Network Security is 13% of the CISSP — network architecture, secure protocols, and the OSI layers where attacks live."
---

## What this domain actually tests

Secure network architecture, segmentation, secure protocols, and network attacks — from a **design and governance** perspective rather than a configuration one. You are not typing commands here; you are deciding what the network should look like and why.

**The OSI model** appears, and you should be able to place **devices, protocols, and attacks** on the correct layer. Questions ask "at which layer does this attack operate?" and the answer determines the control.

**Secure protocols and their insecure ancestors** — this is a reliable, mechanical source of marks:

| Insecure | Secure replacement |
|---|---|
| Telnet | **SSH** |
| FTP | **SFTP / FTPS** |
| HTTP | **HTTPS (TLS)** |
| SNMPv1/v2 | **SNMPv3** |
| POP3 / IMAP | Their TLS variants |
| LDAP | **LDAPS** |

If a scenario has an insecure protocol in use, the answer is very often simply "replace it with the secure equivalent."

## The traps

**Segmentation limits lateral movement.** If a scenario describes an attacker who compromised one host and is spreading, the architectural answer is **segmentation** (or microsegmentation). This is the network domain's version of "contain first."

**VPN types.** **Site-to-site** (two networks joined) versus **remote-access** (one user to a network). **IPsec** (network layer — tunnel mode encrypts the whole original packet including headers; transport mode encrypts only the payload) versus **TLS/SSL VPNs** (application layer, browser-friendly).

Tunnel mode versus transport mode is examinable: **tunnel mode hides the original IP header**, which is why it is used site-to-site across the internet.

**Defence in depth means layers, not one strong control.** Given two options — one excellent control, or several overlapping adequate ones — the exam prefers the layered answer.

**Wireless security ordering:** WEP (broken) → WPA (weak) → WPA2 → **WPA3**. Always pick the newest available. And an **evil twin** is a rogue AP impersonating a legitimate SSID.

**Know the attacks by their mechanism**, not just their names: DDoS, on-path/MITM, DNS poisoning, ARP spoofing, session hijacking. And remember the CISSP framing — the answer to an attack is often a *policy or architectural* control, not a device.

## How to study it

Draw a segmented network from memory: DMZ, internal zones, management network, and where the controls sit between them. Placement is what this domain examines.

Then learn the insecure-to-secure protocol table cold. It is pure recall and it appears reliably.

And keep the managerial lens on: when a network question offers a technical device and an architectural or policy answer, the architectural one is more often correct than your engineering instinct will want to believe.
