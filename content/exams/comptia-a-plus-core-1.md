---
title: "CompTIA A+ Core 1 (220-1101) Study Guide"
description: "How to pass the first half of CompTIA A+: the five domains, the specs worth memorising, the troubleshooting order, and a study approach for your first IT certification."
examCode: "220-1101"
slug: "comptia-a-plus-core-1"
updated: "2026-07-13"
faqs:
  - q: "Do I need both Core 1 and Core 2 to be A+ certified?"
    a: "Yes. A+ is a two-exam certification: Core 1 (220-1101) covers hardware, mobile devices, networking, virtualisation, and troubleshooting; Core 2 (220-1102) covers operating systems, security, software, and operational procedures. You are only A+ certified once you pass both, and they are booked and paid for separately."
  - q: "Is A+ worth it, or should I skip to Network+ or Security+?"
    a: "It depends where you are starting. If you are entering IT with no experience, A+ is the credential that entry-level helpdesk and desktop-support postings actually ask for, and it is the gentlest on-ramp. If you already work in IT and are heading for networking or security, you can reasonably skip it — nothing in Network+ or Security+ formally requires it."
---

CompTIA A+ is the standard first certification for IT careers, and Core 1 (220-1101) is the first of its two required exams. It covers the physical and connected side of IT support: hardware, mobile devices, networking fundamentals, virtualisation, and hardware troubleshooting. Pass Core 1 and Core 2 (220-1102, which covers operating systems and security) and you are A+ certified.

The material is not difficult. The challenge is **breadth** — a very wide surface of specifications, connectors, and standards, most of which is straightforward memorisation once you accept that that is what it is.

## Who should take it

A+ assumes no prior certification and is designed for people entering IT: helpdesk, desktop support, and field service roles. It is frequently listed as a requirement in entry-level job postings. If you already work in IT and are heading toward networking or security, you may prefer to start directly with [Network+](/exams/comptia-network-plus) or [Security+](/exams/comptia-security-plus) — but A+ remains the gentlest on-ramp.

## How the exam is scored

Up to 90 questions in 90 minutes, scored 100–900 with a pass mark of **675** — the lowest bar of the CompTIA trio, though the sheer breadth of content makes up for it. Expect multiple choice plus a few performance-based questions, such as matching cable types to uses or configuring a device to a spec.

## The five domains, one by one

### Hardware and Network Troubleshooting (29%)

The **largest domain**, which surprises people who assume A+ is mostly about naming components. Nearly a third of the exam is diagnosis.

Learn CompTIA's troubleshooting methodology **in order**, because they test the sequence explicitly and it is free marks:

1. Identify the problem
2. Establish a theory of probable cause (question the obvious)
3. Test the theory to determine cause
4. Establish a plan of action and implement the solution
5. Verify full system functionality and implement preventive measures
6. **Document** findings, actions, and outcomes

Documentation is **last**, and verification comes **before** it. Candidates lose this mark constantly because the order "seems obvious" and they never actually memorise it.

Then symptom-to-cause pattern matching: no POST and continuous beeps, a machine that powers on but shows nothing on screen, overheating and thermal shutdown, a drive that clicks, RAID failure states, and the printer material — **laser printing stages appear on nearly every exam** and are worth learning by heart: processing, charging, exposing, developing, transferring, fusing, cleaning.

### Hardware (25%)

The second-largest, and the classic A+ content. Motherboards, CPU sockets, RAM types (DDR4 versus DDR5, and the fact that they are not interchangeable), storage (HDD versus SSD versus **NVMe**, and the SATA/M.2 form factors), power supplies and wattage, cooling, and BIOS/UEFI settings.

**RAID levels** are reliably tested and easily learned:

| RAID | What it does | Minimum disks |
| --- | --- | --- |
| 0 | Striping — speed, **no** redundancy (one disk dies, all data lost) | 2 |
| 1 | Mirroring — full redundancy, half the usable capacity | 2 |
| 5 | Striping with distributed parity — survives **one** disk failure | 3 |
| 10 | Mirrored pairs, striped — speed and redundancy, expensive | 4 |

Expect "a user needs X — which component?" questions, and cables and connectors as pure memorisation: USB generations and their speeds, DisplayPort versus HDMI versus DVI, and Ethernet cable categories (Cat 5e, Cat 6, Cat 6a) with their supported speeds and distances.

### Networking (20%)

A preview of [Network+](/exams/comptia-network-plus), at a shallower depth. Common ports and protocols, TCP/IP basics, DHCP and DNS at a concept level, Wi-Fi standards and their frequency bands (2.4 GHz travels further and penetrates walls better; 5 GHz and 6 GHz are faster but shorter-range), network hardware (switch, router, access point), and SOHO router configuration.

### Mobile Devices (15%)

Laptop component replacement — RAM, storage, batteries, and display assemblies — plus display technologies, and mobile connectivity: Bluetooth pairing, NFC, hotspots, and synchronisation. Largely practical and largely intuitive if you have ever opened a laptop.

### Virtualisation and Cloud Computing (11%)

The smallest domain and definition-level only. **Type 1 hypervisors** run on bare metal (ESXi, Hyper-V) and **Type 2** run on top of a host OS (VirtualBox, VMware Workstation). Resource requirements for VMs, cloud models (IaaS, PaaS, SaaS), and cloud characteristics — shared responsibility, measured service, rapid elasticity — at a recognition level. Do not go deep here; the weighting does not justify it.

## The specs worth memorising

A+ rewards rote learning more than any other exam in this set, and refusing to accept that is a common way to fail it. Build flashcards on day one for:

- **USB** generations and their speeds
- **Wi-Fi** standards (802.11n/ac/ax), their bands and speeds
- **RAID** levels and minimum disk counts
- **Ethernet cable** categories, speeds, and maximum distances
- **RAM** types and their form factors (DIMM vs SO-DIMM)
- **Common ports** — 20/21, 22, 23, 25, 53, 67/68, 80, 110, 143, 443, 3389
- **The six troubleshooting steps**, in order
- **The seven laser printing stages**, in order

That list is a genuinely large fraction of the exam, and all of it is memorisation you can bank early.

## How to prepare

Give yourself four to six weeks.

The material is not deep but it is **wide**, and the real risk is forgetting week-one content by the time you finish week five. **Daily mixed-topic practice questions solve this far better than chapter-by-chapter cramming** — spaced, interleaved recall is exactly the right tool for a broad memorisation exam, and studying one topic to completion before moving on is exactly the wrong one.

If you can, open a real PC. Identifying RAM, storage, and expansion slots by sight makes hardware questions concrete in a way that diagrams do not. Failing that, a teardown video is a distant second best.

## Common pitfalls

Candidates trip on speed and spec memorisation — USB and Wi-Fi standards especially — because they treat it as something to absorb passively rather than drill.

They skip the troubleshooting-step order because it seems obvious, then lose the marks anyway.

And they underestimate the printer questions. Laser printing stages appear on nearly every exam and candidates consistently arrive without having learned them, because printers feel like the least interesting thing in IT. They are free marks and they are left on the table every day.

## After you pass

Check the [official CompTIA A+ page](https://www.comptia.org/certifications/a) for current pricing and the free exam objectives PDF.

Remember Core 1 is only half of A+ — **book 220-1102 while the study momentum is fresh.** After A+, the classic progression is [Network+](/exams/comptia-network-plus) then [Security+](/exams/comptia-security-plus), each building directly on the last.
