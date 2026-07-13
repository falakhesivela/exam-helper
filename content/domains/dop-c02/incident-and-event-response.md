---
description: "Incident and Event Response is 14% of the DOP-C02 — the smallest domain, and almost entirely a test of one principle: event-driven beats scheduled."
---

## What this domain actually tests

The smallest domain on the exam, and in practice it is a sustained examination of a single principle:

> **Event-driven beats scheduled. Always.**

Something happens; the system reacts to it *because it happened*, not because a timer went off. If one option triggers on an EventBridge event and another runs a cron job or polls every fifteen minutes, the event-driven one wins — almost without exception.

The toolkit is small and it composes:

- **EventBridge rules** — the trigger. They match events from AWS services and route them.
- **Systems Manager Automation runbooks** — the remediation. Pre-written, parameterised, repeatable fixes.
- **AWS Config rules** — detect non-compliance, and can invoke a runbook to fix it.
- **Incident Manager** — engagement, escalation, and response plans for real incidents.
- **AWS Health events** — AWS telling you something is wrong on their side.
- **FIS (Fault Injection Simulator)** — deliberately breaking things to prove the automation works.

Most questions in this domain are one of these wired to another.

## The traps

**The scheduled-Lambda distractor.** It will be there, it will be plausible, and it will be wrong. "A Lambda function that runs every hour to check for X" loses to "an EventBridge rule that fires when X happens." Polling is a wrong answer by default at professional level, and this domain is where that rule earns its keep.

**A human in the loop is a losing answer.** If a solution requires someone to run a script, click approve, or read a report, it loses to one that does not — unless the question explicitly requires human approval, which it occasionally does for production changes.

**Config auto-remediation is the reusable shape.** Config rule detects the non-compliant resource → SSM Automation document fixes it. Drift that corrects itself. If a scenario describes something that keeps getting misconfigured and must be put right without anyone noticing, this is it.

**FIS is for proving resilience, not causing outages.** Questions about validating that your failover actually works — before you need it to — are pointing at fault injection.

## How to study it

Build one thing: an **EventBridge rule that triggers an SSM Automation runbook.** Pick something small — an EC2 instance gets tagged incorrectly, and a runbook fixes the tag. It will take you an evening, and it is the entire domain in miniature.

Then, in every practice question in this domain, look at the options and ask: *which of these reacts to an event, and which of these goes looking on a timer?* Strike out the timer. You will be right far more often than you are wrong, and on an exam where four options all technically work, a reliable heuristic is worth more than another fact.

At 14%, this is roughly ten questions — and they are among the most systematically winnable on the paper, because they all reduce to the same principle.
