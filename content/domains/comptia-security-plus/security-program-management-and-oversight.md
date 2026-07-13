---
description: "Security Program Management and Oversight is 20% of Security+ SY0-701 — governance and risk. Dry, but the marks are the most reliable on the exam."
---

## What this domain actually tests

Governance, risk, and compliance. It is the driest domain on the exam and candidates consistently under-study it — which is a mistake, because **the material is fixed and the marks are therefore the most reliable on the paper.** There is nothing to reason about. You either learned it or you didn't.

## The traps

### The risk maths

It appears as straight arithmetic and it is worth ten minutes of your life to nail permanently:

- **SLE** (Single Loss Expectancy) = **Asset Value × Exposure Factor**
- **ALE** (Annualised Loss Expectancy) = **SLE × ARO** (Annual Rate of Occurrence)

**Worked example.** An asset is worth £200,000. An incident destroys 25% of its value. It happens three times a year.

- SLE = £200,000 × 0.25 = **£50,000**
- ARO = 3
- ALE = £50,000 × 3 = **£150,000**

A control costing £90,000/year is therefore worth buying. One costing £160,000/year is not — you would be spending more than the loss you are preventing. That is the entire genre of question, and it is free marks.

### The four risk responses

**Accept** (do nothing, absorb it), **Avoid** (stop doing the risky activity), **Transfer** (insurance, or a contract that shifts liability), **Mitigate** (implement a control to reduce it).

Buying cyber insurance is **transfer**, not mitigation. Discontinuing a vulnerable service is **avoidance**. These get swapped.

### The document hierarchy

- **Policy** — mandatory, high-level, states *what* and *why*.
- **Standard** — mandatory, specific (e.g. "passwords must be 14 characters").
- **Procedure** — step-by-step, *how* to do it.
- **Guideline** — **optional**, recommended.

The tested distinction: **guidelines are not mandatory.** Everything else in that list is.

### Third-party risk and the agreements

**SLA** (service levels), **MOU** (memorandum of understanding — non-binding), **BPA** (business partners agreement), **NDA**. The exam asks which document covers which relationship.

## How to study it

Do the risk formulas once, properly, with real numbers — then test yourself a week later. They are the highest-certainty marks available on Security+ and they take one session.

Then build a table of the four risk responses with a real-world example of each, and a table of the document types with what makes each mandatory or not.

Do **not** skip this domain because it is dull. It is 20% of the exam — roughly eighteen questions — and unlike the threats domain, nothing here requires judgement or pattern recognition. It is the cheapest fifth of the exam, and candidates who run out of steam before reaching it hand those marks away for nothing.
