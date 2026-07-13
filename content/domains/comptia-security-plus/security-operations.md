---
description: "Security Operations is 28% of Security+ SY0-701 — the biggest domain. Incident response order, order of volatility, and the containment rule that decides most questions."
---

## What this domain actually tests

The largest domain on the exam, and the closest to an actual SOC job. **Incident response dominates it**, and it is tested as a *sequence*.

**The incident response phases, in order:**

1. Preparation
2. Detection and analysis
3. **Containment**
4. Eradication
5. Recovery
6. Lessons learned

The exam describes a scenario mid-incident and asks what you do **next**. Which brings us to the single most valuable rule in the domain.

## The traps

### Contain before you eradicate

You have identified compromised hosts. What is your *next* action?

Not "rebuild the server." Not "notify management." Not "run a full scan." **Isolate the affected systems.** You stop the bleeding first, and you do it before you start cleaning up.

This ordering — containment precedes eradication precedes recovery — resolves a whole family of "what do you do FIRST" questions, and the technically satisfying answer (fix it properly) is exactly the distractor.

### Order of volatility

For forensics, collect the **most ephemeral evidence first**:

> CPU registers and cache → **RAM** → swap/paging file → disk → remote logs → archived backups

A question asking what to capture first on a **live** compromised machine wants **memory**, not a disk image. Pulling the plug destroys the most valuable evidence you had — which is why "power off the machine to preserve it" is a wrong answer that sounds responsible.

**Chain of custody** is the companion concept: who handled the evidence, when, and why, documented continuously. Break the chain and the evidence is worthless in court.

### SIEM versus SOAR

- **SIEM** — aggregates and *correlates* logs, and alerts.
- **SOAR** — *automates the response* with playbooks.

If the requirement is reducing analyst workload by automating repetitive response actions, it is SOAR.

### The BC/DR metrics

**RTO** (how long you can be down), **RPO** (how much data you can lose), **MTTR** (mean time to repair), **MTBF** (mean time between failures). They are tested as definitions and inside scenarios, and RTO/RPO get swapped deliberately.

## How to study it

Memorise the six IR phases as a sequence you can recite. Then, for every practice question in this domain, before you look at the options, ask: **"which phase am I in, and what is the next one?"** The answer is usually just... the next phase.

Then learn the order of volatility as a physical list — most fleeting to most durable — and practise the "what do you collect first" question until *memory* is your instant answer.

At 28% this is roughly 25 questions. It is the single biggest block of marks on the exam, and it is unusually rule-governed: sequences, orders, and definitions rather than judgement. Learn the sequences and the domain largely answers itself.
