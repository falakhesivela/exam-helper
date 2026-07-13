---
title: "Security+ SY0-701: A 6-Week Study Plan That Actually Works"
description: "A week-by-week Security+ plan built around domain weights, PBQ practice, and the acronym problem — designed for people studying alongside a full-time job."
slug: "security-plus-sy0-701-six-week-plan"
examCode: "SY0-701"
date: "2026-06-18"
---

Most failed [Security+](/exams/comptia-security-plus) attempts share a cause: unstructured study that spends equal time everywhere, runs out of steam around the governance domain, and never rehearses performance-based questions. Six weeks at 8–10 hours a week fixes all three — if the weeks are shaped correctly.

## Week 1: General security concepts + the acronym system

Start with the foundations domain: the CIA triad, control categories (technical, managerial, operational, physical) and types (preventive, detective, corrective...), and cryptography fundamentals — symmetric vs asymmetric, hashing vs encryption vs signing, PKI and certificates.

Also start the habit that pays off most: **a running acronym glossary**. SY0-701 is drowning in them, and cramming 300 acronyms in the final week fails reliably. Add every new one as you meet it, review the list for ten minutes daily, and by exam week it's simply done.

## Weeks 2–3: Threats, vulnerabilities, and mitigations

This is the heaviest-weighted domain and it deserves two full weeks. The exam's signature move is symptom-first: instead of "define smishing", you get "an employee receives a text claiming to be from the CEO..." — so study attack types by their *indicators*, not their definitions. Malware families, social-engineering variants, application attacks (injection, XSS, buffer overflow), and network attacks (on-path, DDoS, DNS poisoning), each paired with its telltale symptoms and its standard mitigation.

End week 3 with your first timed mini-exam on these two domains only. Weakness here undermines everything later.

## Week 4: Architecture and operations

Two domains, one week, because they interlock: zero trust and segmentation, firewall/IDS/IPS placement, and cloud shared responsibility on the architecture side; then the operational machinery — incident response phases (memorise the order: preparation, detection, analysis, containment, eradication, recovery, lessons learned), log analysis, SIEM concepts, and forensics basics like chain of custody and order of volatility.

Sequence questions ("what do you do FIRST?") cluster in this material. When in doubt: contain before you eradicate, and preserve evidence before you rebuild.

## Week 5: Governance + first full mock

Risk management is more testable than it looks: quantitative risk calculations (SLE = AV × EF, ALE = SLE × ARO) appear as straight arithmetic, and policy/standard/procedure/guideline distinctions are quick marks. Cover third-party risk, awareness training, and the compliance alphabet at recognition level.

Then take a full-length, timed, 90-question mock — including PBQs. The result doesn't matter; the domain-by-domain breakdown does. That breakdown is your week-6 syllabus.

## Week 6: Repair, PBQs, and exam tactics

Daily fresh practice questions weighted toward your two weakest domains, plus dedicated PBQ rehearsal: matching attacks to descriptions, ordering IR steps, configuring firewall rules. On exam day, consider flagging the PBQs that open the exam and returning after the multiple choice — they consume disproportionate time, and confidence from 60 answered questions makes them easier.

One last tactic: Security+ asks for the "BEST" or "FIRST" answer, and several options are often defensible. Eliminate the two clearly wrong ones, then ask which remaining option is *most complete* or *most immediate*. That tiebreaker, applied consistently, is worth several questions — often the several that decide a 750.
