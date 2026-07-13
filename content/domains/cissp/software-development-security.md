---
description: "Software Development Security is 10% of the CISSP — where technical candidates unexpectedly lose marks, because it is framed managerially rather than technically."
---

## What this domain actually tests

**This is where technical candidates unexpectedly lose marks** — and developers lose them worst of all.

The reason is simple and worth stating plainly: **the domain is framed managerially, not technically.** It is not about writing secure code. It is about *governing* the process by which code gets written, acquired, and deployed. Developers arrive expecting to be tested on what they know, and are instead tested on how they would *manage* people who know it.

**The SDLC models** by name — Waterfall (sequential, rigid), Agile (iterative), Spiral (risk-driven, with a risk analysis in each cycle), and DevSecOps (security integrated continuously into delivery).

**Security must be built in from the start.** The single most-repeated idea in the domain: **the earlier a defect is found, the cheaper it is to fix.** A flaw caught in the requirements phase costs a fraction of one caught in production. Any option that adds security testing *late* is competing against one that adds it *early*, and early wins.

## The traps

**Threat modelling happens at design time**, not after the code is written. **STRIDE** (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege) is the framework worth knowing by name.

**Testing types, and which finds what:**

- **SAST** — static. Analyses source code **without running it**. Finds flaws early. High false positives.
- **DAST** — dynamic. Tests the **running** application. Finds runtime and configuration issues.
- **Fuzzing** — malformed input, to find crashes and unhandled conditions.

**Change management is a security control.** Unauthorised changes are a security incident, not merely an operational annoyance. Questions describe a developer pushing straight to production and expect you to identify the *process* failure — not to debug the code.

**Software supply chain and acquisition risk.** Third-party libraries, open-source dependencies, and vendor software all carry risk you inherit. **You remain accountable for code you did not write.** Options involving "trust the vendor's assurances" are wrong; the answer involves verification, contractual requirements, and assessment.

**Separation of duties applies to code.** The person who writes it should not be the person who approves and deploys it to production. This is exactly the kind of control that feels like friction to an engineer and is the correct answer here.

**Databases:** know **aggregation** (combining low-sensitivity data to infer something sensitive) and **inference** (deducing sensitive facts from what you can legitimately see), plus polyinstantiation as a defence.

## How to study it

**Give this domain more time than your instincts suggest**, especially if you are a developer. Your intuitions are actively wrong here in precisely the way the exam punishes.

For every question, ask: *is the answer a process, a policy, or an assurance activity?* It usually is. "Add a code review gate" beats "fix the vulnerability." "Require the vendor to provide an SBOM" beats "scan the binary."

Ten percent of the exam, and one of the highest-yield domains for a technical candidate to consciously rewire.
