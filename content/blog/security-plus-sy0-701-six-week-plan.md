---
title: "Security+ SY0-701: A 6-Week Study Plan That Actually Works"
description: "A week-by-week Security+ plan built around domain weights, PBQ tactics, the acronym problem, and the BEST-answer tiebreaker — designed for people studying alongside a full-time job."
slug: "security-plus-sy0-701-six-week-plan"
examCode: "SY0-701"
date: "2026-06-18"
updated: "2026-07-13"
---

Most failed [Security+](/exams/comptia-security-plus) attempts share a cause: unstructured study that spends equal time everywhere, runs out of steam around the governance domain, and never rehearses performance-based questions. Six weeks at 8–10 hours a week fixes all three — if the weeks are shaped correctly.

The shape matters because the domains are not equal. Security Operations is 28% of the exam and General Security Concepts is 12%. Studying them for the same length of time is a choice to be under-prepared for more than twice as many questions.

## Week 1: General security concepts + the acronym system

Start with the foundations: the CIA triad, control categories (technical, managerial, operational, physical) and types (preventive, detective, corrective, compensating), and cryptography fundamentals.

On cryptography, do not get lost in the maths — there isn't any on the exam. What you need is which tool solves which problem, and above all **which key does what**:

- **You encrypt with the recipient's public key.** Only they can decrypt it, using their private key. This gives confidentiality.
- **You sign with your own private key.** Anyone can verify it with your public key. This gives integrity, authentication, and non-repudiation.

Those two sentences collapse an entire category of exam questions. Get them straight in week one and they pay you back for six weeks.

Also start the habit that pays off most: **a running acronym glossary**. SY0-701 is drowning in them, and cramming 300 acronyms in the final week fails reliably. Add every new one the moment you meet it, review the list for ten minutes daily, and by exam week it is simply done. This is the single highest-leverage habit for this exam and it costs almost nothing.

## Weeks 2–3: Threats, vulnerabilities, and mitigations (22%)

The second-heaviest domain, and it deserves two full weeks.

The exam's signature move is **symptom-first**. Instead of "define smishing," you get "an employee receives a text message claiming to be from the CEO, asking them to buy gift cards…" So study attack types by their *indicators*, not their definitions. If your notes are a list of definitions, you are preparing for a test the exam is not going to give you.

Build the material as symptom → attack → mitigation triples:

| Symptom in the stem | Attack | Standard mitigation |
|---|---|---|
| Text message impersonating an executive | Smishing | Awareness training, out-of-band verification |
| Login form returns database errors on `'` input | SQL injection | Parameterised queries, input validation |
| Script executes in another user's browser session | XSS | Output encoding, CSP |
| Traffic silently intercepted and modified | On-path (MITM) | TLS, certificate pinning |
| Malware that spreads with no user action | Worm | Segmentation, patching |
| Malware that hides its own presence at kernel level | Rootkit | Secure boot, integrity monitoring |
| Action performed as a logged-in user without consent | CSRF | Anti-forgery tokens |

End week 3 with your first timed mini-exam on these two domains only. Weakness here undermines everything later, and you want to find it now rather than in week 6.

## Week 4: Architecture (18%) and operations (28%)

The heaviest week, because Security Operations is the biggest domain on the exam.

On architecture: zero trust, segmentation, and — reliably tested — **device placement and function**. A firewall filters by rule. An IDS detects and alerts. An IPS detects and *blocks* inline. A WAF understands HTTP and stops application-layer attacks. A proxy mediates outbound requests. Questions that describe wanting to *automatically stop* an attack rather than be told about it are testing IDS versus IPS.

On operations, two things carry the domain.

**Incident response, in order:** preparation → detection and analysis → containment → eradication → recovery → lessons learned. Sequence questions cluster here, and the rule that resolves most of them: **contain before you eradicate.** If you have identified compromised hosts and the question asks what you do *next*, the answer is isolate them. You stop the bleeding first. Not "rebuild the server," not "notify management."

**Order of volatility**, for forensics: collect the most ephemeral evidence first — CPU registers and cache, then RAM, then swap, then disk, then backups. A question about what to capture first on a live compromised machine wants **memory**, not a disk image. Chain of custody rounds it out.

## Week 5: Governance (20%) + first full mock

Risk management is far more testable than it looks, because the material is fixed and the maths is trivial. Learn it permanently in one session:

- **SLE** (Single Loss Expectancy) = Asset Value × Exposure Factor
- **ALE** (Annualised Loss Expectancy) = SLE × ARO (Annual Rate of Occurrence)

Worked example: an asset worth £200,000, an incident that destroys 25% of its value, occurring three times a year. SLE = £50,000. ARO = 3. ALE = £150,000. A control costing £90,000 a year is therefore worth buying; one costing £160,000 is not. That is the entire genre, and it is free marks.

Know the four risk responses (accept, avoid, transfer, mitigate), the policy/standard/guideline/procedure distinctions, third-party risk, and the compliance alphabet at recognition level.

Then take a **full-length, timed, 90-question mock — including PBQs.** The score does not matter. The domain-by-domain breakdown does, and it is your week-6 syllabus.

## Week 6: Repair, PBQs, and exam tactics

Daily fresh practice questions weighted toward your two weakest domains, plus dedicated PBQ rehearsal.

### The PBQ tactic

Performance-based questions arrive at the *start* of the exam and eat time disproportionately — a PBQ can take five minutes where a multiple-choice question takes one. Candidates who grind through them in order routinely find themselves with 60 questions left and 40 minutes.

**Skim them, attempt anything obvious, flag the rest, and go clear the multiple choice.** Come back with 25 minutes left and a settled head, and with the confidence of 70 answered questions behind you. This one decision is worth more than any single piece of content knowledge on this exam.

### The BEST-answer tiebreaker

Security+ asks for the "BEST" or "FIRST" answer, and several options are often defensible. The procedure:

1. Eliminate the two clearly wrong options.
2. Of the two remaining, ask: **which would I do *first*?** Not which is more thorough — which comes first in time.
3. If they are simultaneous, ask which is *most complete*.

Applied consistently, that tiebreaker is worth several questions — often exactly the several that decide a 750.

You are ready to book when you are scoring 85%+ on fresh questions, no domain is below 75%, and PBQs feel boring rather than alarming.
