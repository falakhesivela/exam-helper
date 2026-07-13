---
description: "Asset Security is 10% of the CISSP — data classification and the ownership roles, which are easy marks and easily confused."
---

## What this domain actually tests

Data: how it is classified, who is responsible for it, and how it is protected through its lifecycle.

**The roles are the heart of the domain**, they are easy marks, and they are confused constantly. Learn them precisely:

| Role | Responsibility |
|---|---|
| **Data owner** | **Classifies** the data and is **accountable** for it. A senior business person. |
| **Data custodian** | **Implements** the controls day to day. Typically IT. |
| **Data controller** | Determines **why and how** data is processed (GDPR term) |
| **Data processor** | Processes it **on the controller's instructions** |
| **Data steward** | Responsible for data **quality** and business meaning |
| **Data subject** | The **person the data is about** |

**The owner classifies; the custodian implements.** That single sentence is worth several marks and it is the distinction the exam probes hardest. The owner is *accountable* and cannot delegate accountability, even though they delegate the work.

## The traps

**Accountability cannot be delegated.** The data owner remains accountable even when a custodian does the work and even when a processor is a third party. This is a management principle and the exam enforces it.

**Data remanence** — data left behind after deletion. Know the sanitisation ladder and what each achieves:

- **Clearing** — overwriting. Protects against ordinary recovery. The media can be reused.
- **Purging** — more thorough (e.g. degaussing magnetic media). Protects against laboratory attack.
- **Destruction** — physical (shredding, incineration, pulverising). The only guaranteed method.

The trap: **deleting a file does not remove the data**, and **formatting a drive does not either**. And note that **degaussing does not work on SSDs** (there is no magnetic domain to disrupt) — for solid state, use cryptographic erasure or physical destruction. That SSD point is a modern favourite.

**Classification drives handling.** The label determines who may access it, how it is stored, how it is transmitted, and how it is destroyed. Classification is not a filing exercise; it is what makes every downstream control decidable.

**Data lifecycle:** create → store → use → share → archive → destroy. Controls apply at every stage, and questions ask about the stage you would rather forget (destruction).

**Retention:** keep data as long as required and **no longer**. Over-retention is a *liability*, not prudence — an idea that surprises people. If you still hold it, you can still lose it, and you can still be compelled to produce it.

## How to study it

Memorise the role table. Then test yourself on the one question that matters: *who classifies the data?* If the answer is not "the owner," go back.

Then learn the sanitisation ladder and the SSD exception.

At 10% this is a small domain, and it is one of the most efficiently learnable on the exam — almost all definition, almost no judgement. Do not leave it to the last week just because it is not exciting.
