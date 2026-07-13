---
description: "Network Operations is 19% of Network+ N10-009 — the domain candidates skip because it 'feels soft'. It's nearly a fifth of the exam and can swing a borderline result."
---

## What this domain actually tests

Monitoring, documentation, change management, and disaster recovery.

**This is the domain candidates skip**, because it feels like paperwork rather than networking. It is **19% of the exam** — nearly a fifth — and it is comfortably enough to swing a borderline result. Skipping it is one of the most common unforced errors on Network+.

**Monitoring:** SNMP (polling devices for status), **NetFlow** (traffic flow analysis — *who is talking to whom, and how much*), and **syslog** (centralised event logging, with severity levels). If a scenario asks which tool identifies the top bandwidth consumers, it is **NetFlow**, not SNMP.

**Documentation:** network diagrams (physical versus logical), IP address management (IPAM), asset inventory, and baselines. A **baseline** is what "normal" looks like — you cannot identify abnormal performance without one, and questions make that point.

## The traps

### RPO versus RTO

These get swapped deliberately and they are not the same thing:

- **RPO** (Recovery Point Objective) — **how much data you can afford to lose.** It dictates backup *frequency*.
- **RTO** (Recovery Time Objective) — **how long you can afford to be down.** It dictates recovery *capability*.

A requirement of "we can lose at most one hour of data" is an **RPO**. "We must be back within four hours" is an **RTO**. A solution can satisfy one and fail the other.

### The recovery sites

| Site | What it is | Recovery time |
|---|---|---|
| **Hot** | Fully running, data replicated, ready now | Minutes |
| **Warm** | Hardware and connectivity in place, some data | Hours |
| **Cold** | An empty room with power and space | Days |

The exam gives you a downtime tolerance and a budget and expects the **cheapest site that meets the requirement** — not the best one.

### High availability terms

**Redundancy** (spare components), **failover** (automatic switch to the spare), **load balancing** (sharing work across several), and **clustering**. Also **MTTR** (mean time to repair) and **MTBF** (mean time between failures).

### Change management

Proposed change → risk analysis → approval → implementation → documentation → rollback plan. If a question describes an outage caused by an unapproved change, it is testing whether you know the process exists.

## How to study it

Do not skim this domain because it lacks packets. Give it real sessions.

Learn **RPO versus RTO** as a single card — *data lost versus time down* — and the three site types with their trade-offs. Those two items account for a disproportionate share of the domain's questions and take under an hour.

Then learn the three monitoring tools by the question each answers: *is the device up?* (SNMP), *who is using the bandwidth?* (NetFlow), *what happened and when?* (syslog).

Nineteen percent of the exam, mostly definitions, almost no reasoning required. It is some of the cheapest marks on the paper — and they are handed away every day by candidates who ran out of enthusiasm before they got here.
