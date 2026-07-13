---
description: "Monitor and Maintain Azure Resources is 15% of AZ-104 — the smallest domain. Azure Monitor, Log Analytics and KQL, and the Network Watcher tools the exam loves."
---

## What this domain actually tests

The smallest domain on the exam, and the most practical. It is about knowing which tool answers which question.

**Azure Monitor** collects **metrics** (numeric, time-series, near-real-time) and **logs** (rich, queryable, stored in a Log Analytics workspace). That split matters: metrics are for alerting quickly on numbers, logs are for investigating in depth.

**Log Analytics workspaces** are where log data lives, and it is queried with **KQL**. You do not need to write complex KQL, but you should be able to read a simple query and say what it returns — a `where`, a `summarize`, a `project`. That is the level tested.

**Alerts and action groups.** An alert rule fires on a condition; an **action group** defines what happens then (email, SMS, webhook, run a Logic App or Function). Questions separate the *detection* from the *response*, and the action group is the response half.

## The traps

**Network Watcher is the troubleshooting toolkit, and the exam reaches for it constantly** — which is why it appears in a monitoring domain rather than the networking one:

- **IP flow verify** — answers "is this traffic allowed, and if not, **which rule blocked it**?" This is the single most useful tool in the domain and the answer to a whole family of connectivity questions.
- **Effective security rules** — shows the *combined* NSG rules actually applying to a NIC, after subnet-level and NIC-level rules are merged.
- **Connection troubleshoot** and **NSG flow logs** for deeper analysis.

If a scenario describes a VM that cannot be reached and asks how to diagnose it, the answer is almost always one of these — not "review the NSG rules manually," which is what a candidate without hands-on experience picks.

**Azure Monitor versus Service Health versus Advisor.** Three tools that all sound like "Azure tells you something":

- **Azure Monitor** — *your resources'* metrics and logs.
- **Service Health** — **Azure's own** outages and planned maintenance. If Azure is broken, this is where you find out.
- **Azure Advisor** — **recommendations** to improve cost, security, reliability, and performance.

**Metrics have shorter retention than logs.** If the requirement involves analysing data over months, it needs Log Analytics, not raw metrics.

## How to study it

Break something and diagnose it with the actual tools. Deploy a VM, block RDP or SSH with an NSG rule, then run **IP flow verify** and let it tell you which rule did it. That is fifteen minutes and it converts this domain from abstract to obvious.

Then open a Log Analytics workspace and run a couple of sample KQL queries — just enough that the syntax stops looking alien.

At 15% this is roughly seven or eight questions, and a meaningful share of them are Network Watcher. Do not skip it because monitoring feels less important than networking — a good chunk of this domain *is* networking, wearing a different hat.
