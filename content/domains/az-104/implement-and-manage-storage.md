---
description: "Implement and Manage Storage is 20% of AZ-104 — the replication acronyms, SAS tokens, and the Backup-versus-Site-Recovery distinction."
---

## What this domain actually tests

Storage accounts, and above all **redundancy options** — which the exam asks as a *requirement* and expects you to answer with an acronym.

| Option | Protects against |
|---|---|
| **LRS** | Disk or rack failure inside one datacentre |
| **ZRS** | A whole datacentre (zone) failing, within one region |
| **GRS** | An entire **region** failing — secondary copy exists but is **not readable** |
| **RA-GRS** | Same as GRS, but you **can read** the secondary during the outage |
| **GZRS / RA-GZRS** | Zone redundancy in the primary region **plus** geo-replication |

The mapping to learn, because it turns a memory problem into a decoding problem:

- Requirement mentions a **regional** outage → you need a **G**.
- Requirement also says **readable** during the outage → you need **RA-**.
- Requirement mentions a datacentre or zone failing, in-region → **Z**.

That is genuinely the whole trick, and it converts five confusing acronyms into two rules.

## The traps

**GRS is not readable.** This is the distinction the entire family exists to test. A GRS secondary sits there for disaster recovery and you cannot read from it until Microsoft fails over or you initiate one. If the scenario says applications must continue *reading* data during a regional outage, GRS is wrong and **RA-GRS** is right.

**Azure Backup versus Azure Site Recovery.** Both sound like disaster recovery and they are not the same thing:

- **Backup** protects **data** so you can *restore* it.
- **Site Recovery** replicates **whole machines** so you can *fail over* to another region.

If the requirement is "restore a file someone deleted," it is Backup. If it is "keep the business running when the region goes down," it is Site Recovery. The exam checks that you know which solves which.

**SAS tokens** are delegated, time-limited, scope-limited access to storage **without sharing the account key**. If a scenario needs to give a partner temporary read access to one container, that is a SAS — not a new account key, and not making the container public.

**Access tiers and lifecycle management.** Hot, cool, archive — with archive requiring a **rehydration** that takes hours. If the requirement involves immediate access, archive is eliminated regardless of cost.

## How to study it

Make the requirement-to-acronym table above your primary artefact and drill it as scenarios, not definitions. Write ten requirements in plain English and label each with an acronym. That is exactly the exam's question format.

Then create a storage account, generate a SAS token, and use it. Then set a lifecycle rule and watch a blob move tiers.

Finally, say the Backup-versus-Site-Recovery distinction out loud until it is instant. It is a single sentence — *one restores data, one fails over machines* — and it is worth marks on every attempt of this exam.
