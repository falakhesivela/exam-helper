---
description: "Security Assessment and Testing is 12% of the CISSP — audits, testing types, and why the independence of the auditor is the point."
---

## What this domain actually tests

How you *prove* your controls work — and, importantly, **who is allowed to say so**.

**Vulnerability assessment versus penetration test:**

- A **vulnerability assessment** *finds and reports* weaknesses. Broad, automated, non-destructive.
- A **penetration test** *actively exploits* them to demonstrate real impact. Narrow, manual, and it **requires written authorisation and a defined scope** — without which it is simply a crime.

That authorisation requirement is examinable, and it is a managerial point, not a technical one.

**The testing types**, which are asked by name:

- **Black box** — the tester knows nothing. Simulates an external attacker.
- **White box** — full knowledge, including source and architecture. Most thorough.
- **Grey box** — partial knowledge. Simulates an insider or a compromised user.

**Static versus dynamic testing:** **SAST** analyses source code *without running it*. **DAST** tests the running application from the outside. Also **fuzzing** (malformed input to find crashes) and **interface testing**.

## The traps

### Auditor independence is the whole point

This is the domain's central managerial idea, and engineers systematically undervalue it.

**An audit performed by the team that built the system is worth very little**, regardless of how skilled they are — because the value of an audit lies in its *independence*, not merely in its technical rigour. If a question offers "have the development team review their own code" versus "engage an independent third party," the independent party wins, even if it is slower and more expensive.

**Internal versus external versus third-party audits** map to increasing independence and increasing assurance.

### Log review is a detective control, and it must be reviewed

Collecting logs nobody reads provides **no** assurance. The exam makes this point: if a scenario has comprehensive logging and an undetected breach that ran for months, the failure is that **nobody was reviewing the logs**.

### The other assessment vocabulary

**Code review**, **misuse case testing** (testing what an attacker would do, not what a user would do), **test coverage analysis**, and **synthetic transactions** (scripted transactions run against a live system to verify it works).

**KPIs and KRIs** — Key Performance Indicators measure how well things are going; **Key Risk Indicators** are forward-looking warnings that risk is increasing. Reporting to management is part of the domain, because the CISSP certifies the person who *writes* that report.

## How to study it

Learn the testing-type vocabulary as clean definitions — black/white/grey, SAST/DAST — because these are direct recall questions and there is no reasoning to do.

Then internalise the independence principle. On every question in this domain, ask: *who is doing the assessing, and are they independent of what is being assessed?* That question alone resolves a surprising share of the marks, and it is the thing technical candidates most reliably fail to consider.
