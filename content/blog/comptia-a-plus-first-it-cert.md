---
title: "CompTIA A+ Core 1: How to Study for Your First IT Certification"
description: "New to IT and starting with the 220-1101? Here's how to study when everything is unfamiliar — including the memorisation systems that make the breadth manageable."
slug: "comptia-a-plus-first-it-cert"
examCode: "220-1101"
date: "2026-06-15"
updated: "2026-07-13"
---

Studying for your first certification is a different problem from studying for your fifth. Experienced candidates bolt new facts onto an existing mental model. With [A+ Core 1](/exams/comptia-a-plus-core-1), you are building the model itself *while* memorising a genuinely wide syllabus.

That calls for different tactics. Here are the ones that work.

## Accept that breadth is the challenge

Core 1 is not deep. No single topic is hard the way subnetting or cryptography is hard.

The difficulty is that it covers *everything* — RAM types, laptop hinges, Wi-Fi standards, printer mechanics, virtualisation, cable categories — and the exam happily jumps from a question about NVMe drives to one about mobile device synchronisation. **The failure mode is not "I couldn't understand it." It is "I forgot week one by week five."**

That distinction should determine your entire study method. If forgetting is the enemy, then the tool is not more reading — it is **retrieval**.

**The countermeasure is interleaved review:** every study day mixes a majority of new material with practice questions drawn from *everything you have covered so far*. Studying one topic to completion and then never revisiting it is exactly the wrong approach for a broad memorisation exam, and it is what most beginners do by default.

Daily mixed-topic question practice is the single highest-value habit for this exam. It is also the least fun, which is why so few people do it.

## Touch real hardware wherever possible

Reading about RAM slots produces weak memories. Opening a PC case produces strong ones.

You do not need a lab. One old desktop — or even detailed teardown photos — covers most of it. Identify the RAM, the storage connectors, the PSU, the expansion slots. Plug things in. Pull them out. The hardware domain is 25% of the exam, and physical familiarity converts its questions from *memorisation* into *recognition*, which is a far cheaper cognitive operation under time pressure.

For what you cannot touch — server RAID arrays, enterprise printers — watch a five-minute video instead. A visual of a laser printer's imaging process beats a paragraph of text every time.

## The lists you simply have to memorise

A large chunk of Core 1 is unashamedly rote, and refusing to accept that is a common way to fail. Do not *re-read* these — **drill them as flashcards with spaced repetition, ten minutes a day.** Spaced practice turns "impossible list" into "automatic" in about three weeks, and these are the fastest, most certain marks on the exam.

Start these on day one:

- **USB** generations and their speeds
- **Wi-Fi** standards (802.11n / ac / ax), their bands and speeds
- **RAID** levels and minimum disk counts
- **Ethernet cable** categories, speeds, and maximum distances
- **RAM** types and form factors (DIMM vs SO-DIMM)
- **Common ports** — 20/21, 22, 23, 25, 53, 67/68, 80, 110, 143, 443, 3389
- **The six troubleshooting steps**, in order
- **The seven laser printing stages**, in order

### RAID, since it comes up every time

| RAID | What it does | Min disks |
|---|---|---|
| 0 | Striping — speed, **no** redundancy (one disk dies, everything is lost) | 2 |
| 1 | Mirroring — full redundancy, half the usable capacity | 2 |
| 5 | Striping with distributed parity — survives **one** disk failure | 3 |
| 10 | Mirrored pairs, striped — speed *and* redundancy, expensive | 4 |

## Learn the troubleshooting methodology as a ritual

CompTIA's troubleshooting steps are tested **in order**, explicitly:

1. Identify the problem
2. Establish a theory of probable cause
3. Test the theory
4. Establish a plan of action and implement the solution
5. **Verify** full system functionality and implement preventive measures
6. **Document** findings, actions, and outcomes

First-timers skip memorising this because it feels like common sense — and then lose the marks anyway. The exam asks "what should the technician do **NEXT**?" and the answer is simply whichever step follows the one described in the scenario.

**Two traps live in the order.** Documentation is *last*. And **verification comes before documentation** — so if a scenario describes a fix that appears to have worked and asks what you do next, the answer is *verify full functionality*, not "document it and close the ticket."

Memorise it like a poem.

## Do not skip the printers

Laser printing stages appear on nearly every exam, and candidates consistently arrive without having learned them — because printers feel like the least interesting thing in IT.

They are free marks, and they are left on the table every single day. **Processing, charging, exposing, developing, transferring, fusing, cleaning.** Learn the seven, in order, and take the marks.

## A six-week rhythm for beginners

- **Weeks 1–2 — Hardware, cables, and connectors**, with hands-on wherever possible. Start the flashcard drills on day one and never stop.
- **Week 3 — Mobile devices and printers.** Yes, printers. See above.
- **Week 4 — Networking fundamentals and Wi-Fi.** Go slowly here; it is the foundation for [Network+](/exams/comptia-network-plus) later, and time spent now pays twice.
- **Week 5 — Virtualisation, cloud, and the troubleshooting methodology.** Virtualisation is only 11% of the exam and definition-level; do not over-invest.
- **Week 6 — Full-length practice exams and weak-area review**, on fresh questions.

Two hours a day is enough. **Consistency matters far more than intensity** on an exam whose enemy is forgetting.

## Book Core 2 before motivation fades

Core 1 alone certifies nothing. A+ requires **both** exams — Core 1 (220-1101) and Core 2 (220-1102, covering operating systems, security, and software troubleshooting).

The Core 2 material is fresher and more familiar to most people, and candidates who book it within a month of passing Core 1 finish. Those who "take a break" frequently do not.

**Schedule it the day you pass.**
