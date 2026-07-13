---
description: "Security and Compliance is 17% of the DOP-C02 — permission boundaries, SCPs, Config auto-remediation, and telling GuardDuty from Security Hub from Inspector from Detective."
---

## What this domain actually tests

IAM at organisational scale, plus the security services — and the exam's favourite pattern, which is **compliance that fixes itself**.

The central idea to internalise: **preventive beats detective.** An SCP that *stops* the bad thing from happening beats a Config rule that *reports* it afterwards — unless the question explicitly asks for detection, audit, or reporting. When a requirement says "ensure no bucket can ever be made public," it wants prevention, not an alert.

**SCPs never grant anything.** They only restrict what accounts in an organisation are permitted to do. An identity still needs an IAM policy allowing the action. Any option describing an SCP that "gives" a team access is wrong by construction — and this is tested more than its weighting suggests.

**Permission boundaries** are the answer to a specific, recurring scenario: *let developers create IAM roles without letting them escalate their own privileges*. A boundary is a ceiling on what a role can be granted, regardless of the policies attached to it.

## The traps

**The four security services are easy to confuse and easy marks once separated:**

| Service | What it is for |
|---|---|
| **GuardDuty** | Threat *detection* from logs — finds suspicious activity |
| **Security Hub** | *Aggregates* findings across accounts and services into one view |
| **Inspector** | *Vulnerability scanning* of workloads and images |
| **Detective** | *Investigating* an incident's root cause after the fact |
| **Macie** | Finding *sensitive data* (PII) in S3 |

The exam gives you a goal and expects the right one. "We need a single view of findings from all accounts" is Security Hub. "We need to understand how the attacker got in" is Detective.

**Config with auto-remediation is the most reusable pattern in the domain.** A Config rule detects non-compliance and triggers a Systems Manager Automation document to fix it. If a question describes drift that must be corrected without human involvement, this is almost always the shape of the answer.

**Managed beats custom.** If AWS Config can enforce it, a Lambda you wrote yourself is the wrong answer — even though it would work, and even though you would probably write it that way at your actual job.

## How to study it

Build a Config rule with an SSM Automation remediation that fixes a non-compliant S3 bucket. Then break the bucket and watch it repair itself. That one exercise teaches the domain's core pattern permanently.

Then write the five security services on a card with one line each. Most candidates can define them individually and still fumble when asked to choose between them under time pressure — which is exactly how the exam asks.

Finally, get in the habit of asking *"could this have been prevented rather than detected?"* on every security question. At professional level, that question alone resolves a surprising number of them.
