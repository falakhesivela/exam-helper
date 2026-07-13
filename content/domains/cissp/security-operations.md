---
description: "Security Operations is 13% of the CISSP — incident response, forensics, and the containment rule. Where engineers must resist fixing things."
---

## What this domain actually tests

Incident response, forensics, logging and monitoring, and disaster recovery — and it is one of the domains where **the engineer's instinct is most reliably wrong**.

**The incident response phases, in order:** detection → response → mitigation → reporting → recovery → remediation → lessons learned. (ISC2's exact wording varies slightly by source; what matters is the *shape*: you detect, you contain, you clean up, you recover, you learn.)

The rule that resolves most sequence questions: **contain before you eradicate.** You have compromised hosts; your next action is to **isolate** them. Not rebuild, not scan, not notify. Stop the bleeding first.

## The traps

### Order of volatility

Collect the most **ephemeral** evidence first:

> CPU registers and cache → **RAM** → swap → disk → remote logs → backups

A question about what to capture first on a **live** compromised machine wants **memory**. "Power the machine off to preserve evidence" sounds responsible and **destroys** the most valuable evidence you had.

### Chain of custody

Who handled the evidence, when, why, and with what transfer of possession — documented continuously and without gaps. **Break the chain and the evidence is inadmissible**, no matter how damning it is. On a management-level exam, this is not a footnote; it is the point.

### The managerial reflex, again

When a question asks what to do FIRST during an incident, "**follow the incident response plan**" beats "isolate the affected systems" — *if the plan is among the options*. The documented process, not an individual's improvisation, is what scales and what survives a regulator's scrutiny afterwards.

This feels like bureaucratic nonsense to a good engineer. It is the correct answer on this exam, and it reflects the job the CISSP certifies.

### The operational concepts

**Separation of duties** (no one person can complete a critical transaction alone), **job rotation** (detects fraud), **mandatory vacation** (also detects fraud — a person who never takes leave may be concealing something), **least privilege**, and **need to know**.

Those last three exist for *detection*, not just hygiene, and the exam asks why.

**RAID is not backup.** Redundancy protects against hardware failure, not against deletion, corruption, or ransomware.

## How to study it

Memorise the phase sequence and drill the "what comes next?" format until it is mechanical.

Then, on every question in this domain, ask yourself: *am I about to pick the technical fix?* If yes, look again for the option that assesses, contains, or follows the plan. Keep a tally of how often your first instinct was the technician's answer — watching that number fall is how you know you are becoming ready.
