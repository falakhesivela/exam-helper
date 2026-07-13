---
title: "CompTIA Security+ (SY0-701) Study Guide"
description: "The complete guide to Security+ SY0-701: the five domains in detail, performance-based questions, the risk maths, and a six-week preparation plan."
examCode: "SY0-701"
slug: "comptia-security-plus"
updated: "2026-07-13"
faqs:
  - q: "How hard is Security+ if I have no security experience?"
    a: "Passable, but not trivial. The concepts are broad rather than deep, so the difficulty is volume — several hundred terms and acronyms — rather than complexity. Newcomers routinely pass in six to eight weeks. The people who struggle are the ones who memorise definitions without learning to recognise an attack from its symptoms, which is how the exam actually asks."
  - q: "What are performance-based questions and how many are there?"
    a: "PBQs are interactive items — matching attacks to descriptions, ordering incident-response phases, reading a log excerpt, or configuring firewall rules. You typically get a handful at the very start of the exam, and they eat time disproportionately. The standard tactic is to skim them, flag them, clear the multiple choice, and return with your remaining time."
  - q: "Should I take Network+ before Security+?"
    a: "CompTIA recommends it, but it is not required and many people skip it. What matters is that you can read a network diagram, know your common ports, and understand what a firewall, IDS, and proxy each do. If those are already solid, go straight to Security+."
---

CompTIA Security+ is the world's most widely held cybersecurity certification and the de-facto entry ticket to security roles. SY0-701 validates the baseline skills every security job assumes: threats and mitigations, security architecture, operations, and governance. It is also DoD 8140 approved, which makes it effectively mandatory for many US government and contractor positions.

The exam's reputation for being "memorisation-heavy" is half right. There is a lot of vocabulary. But the questions are overwhelmingly *symptom-first* — they describe something happening and ask what it is or what you do next — and pure memorisation does not survive that.

## Who should take it

CompTIA recommends the equivalent of two years of IT experience with a security focus, plus [Network+](/exams/comptia-network-plus)-level knowledge — but Security+ is routinely passed by determined newcomers. It suits helpdesk and sysadmin professionals pivoting to security, developers who need security literacy, and anyone starting a SOC analyst path.

## How the exam is scored

Up to 90 questions in 90 minutes, scored on a scale of 100–900 with a passing score of 750. The exam mixes standard multiple choice with performance-based questions (PBQs) — interactive items where you might match attack types to descriptions, order incident-response steps, or configure a firewall rule set.

PBQs usually arrive first and eat time. The single most useful piece of exam-day advice for Security+: **do not start the exam by grinding through the PBQs.** Skim them, attempt anything obvious, flag the rest, and go clear the multiple choice — where the marks are dense and fast. Come back with 25 minutes left and a settled head.

One minute per question, on average, and PBQs can take five. That maths is the whole reason the tactic works.

## The five domains, one by one

### Security Operations (28%)

The largest domain, and the one closest to an actual SOC job. Incident response dominates it.

Learn the incident-response phases **in order** — preparation, detection and analysis, containment, eradication, recovery, lessons learned — because the exam loves to describe a scenario mid-incident and ask what comes next. The most common trap: you have identified compromised hosts and the question asks for your *next* action. The answer is almost always **contain** (isolate the host, segment the network), not eradicate and not "notify management." You stop the bleeding first.

Know digital forensics fundamentals, especially **chain of custody** and **order of volatility** — collect the most ephemeral evidence first (CPU registers and cache, then RAM, then swap, then disk, then backups). A question about what to capture first on a live compromised machine is asking for memory, not a disk image.

Then SIEM and SOAR (aggregation and correlation vs automated response playbooks), log analysis, and business continuity — RTO, RPO, MTTR, MTBF.

### Threats, Vulnerabilities, and Mitigations (22%)

The second-biggest, and the most scenario-driven. You must be able to go from **symptom to attack name**, not just definition to name.

Social engineering is heavily represented: phishing, spear phishing (targeted), whaling (targeting an executive), vishing (voice), smishing (SMS), pretexting, and business email compromise. Malware types: virus, worm (self-propagating, no user action), trojan, ransomware, rootkit (hides itself, kernel-level), keylogger, logic bomb, and fileless malware.

Know the attack classes and their mitigations as pairs, because that pairing is the question: SQL injection is mitigated by parameterised queries and input validation; XSS by output encoding; CSRF by anti-forgery tokens; on-path (man-in-the-middle) by TLS and certificate pinning; password attacks by MFA, salting, and lockout policies.

### Security Program Management and Oversight (20%)

Governance, risk, and compliance. Drier, but the marks are extremely reliable because the material is fixed.

The risk maths appears and it is worth ten minutes of your life to nail permanently:

- **SLE** (Single Loss Expectancy) = Asset Value × Exposure Factor
- **ALE** (Annualised Loss Expectancy) = SLE × ARO (Annual Rate of Occurrence)

If an asset is worth £100,000, an incident destroys 40% of its value, and it happens twice a year: SLE = £40,000, ARO = 2, ALE = £80,000. If a control costs £50,000 a year and prevents that, you implement it. That is the entire genre.

Know the four risk responses — accept, avoid, transfer (insurance), and mitigate — plus third-party and supply-chain risk, and the compliance alphabet (GDPR, PCI-DSS, HIPAA, SOX) at a recognition level.

### Security Architecture (18%)

Design and placement. Zero trust is the headline concept — never trust, always verify, assume breach — along with network segmentation, DMZs, and microsegmentation.

Know what sits where and what each device actually does: a **firewall** filters by rules; an **IDS** detects and alerts; an **IPS** detects and *blocks* inline; a **WAF** understands HTTP and stops application-layer attacks; a **proxy** mediates outbound requests. Questions that describe wanting to block an attack automatically rather than be told about it are testing IDS versus IPS.

Also: the cloud shared responsibility model, and secure design patterns like defence in depth and least privilege.

### General Security Concepts (12%)

The smallest domain, and mostly cryptography. You need no maths — you need to know which tool solves which problem.

**Symmetric** encryption (AES) is fast and uses one shared key; **asymmetric** (RSA, ECC) is slow and uses a key pair, so it is used to exchange a symmetric key and to sign. **Hashing** (SHA-256) is one-way and proves *integrity*. **Encryption** provides confidentiality. A **digital signature** — hash the message, encrypt the hash with your *private* key — provides integrity, authentication, and non-repudiation together.

The confusion the exam exploits: which key does what. **You encrypt with the recipient's public key** (only they can decrypt, with their private key). **You sign with your own private key** (anyone can verify with your public key). Get those two sentences straight and a whole class of questions collapses.

Round it out with the CIA triad, security control types (preventive, detective, corrective, compensating; technical, administrative, physical), and PKI and certificate basics.

## The distinctions that decide questions

| Confused pair | The difference |
| --- | --- |
| IDS vs IPS | IDS detects and alerts (out of band). IPS detects and blocks (inline). |
| Vulnerability scan vs pen test | A scan finds and reports weaknesses; a pen test actively exploits them to prove impact. |
| Encryption vs hashing | Encryption is reversible with a key (confidentiality). Hashing is one-way (integrity). |
| Authentication vs authorisation | Who you are vs what you're allowed to do. |
| Worm vs virus | A worm self-propagates across a network; a virus needs a user to run something. |
| Risk vs threat vs vulnerability | A vulnerability is the weakness; a threat is what might exploit it; risk is the likelihood and impact of that happening. |
| DAC vs MAC vs RBAC | Owner decides (DAC), system enforces labels/clearance (MAC), permissions attach to job role (RBAC). |
| Containment vs eradication | Stop the spread first; remove the cause second. Order matters and the exam tests it. |

## A six-week plan

**Weeks 1–2 — Threats, and general concepts.** Start with the threats domain: it is heavily weighted and everything else builds on the vocabulary. Do cryptography at the same time, since it underpins architecture later. Start a running acronym glossary on day one and add to it every single session — this is the highest-leverage habit for this exam.

**Weeks 3–4 — Architecture and operations.** Device placement, zero trust, segmentation. Then incident response, drilling the phase order until it is reflexive, and reading real log excerpts until they stop looking like noise.

**Week 5 — Governance, and your first full mock.** The risk formulas, the frameworks, the compliance regimes. Then sit a full 90-minute timed exam to find out where you actually are.

**Week 6 — Mixed practice and PBQ rehearsal.** Fresh questions daily, targeted review of your weakest domain, and deliberate PBQ practice so the format is boring by exam day. Aim to be scoring 85%+ on questions you have never seen before booking.

## Common pitfalls

The acronym volume is the number-one complaint — the glossary habit fixes it. Beyond that, candidates lose marks by memorising attack definitions without being able to recognise an attack from its symptoms, and by burning twenty minutes on PBQs at the start of the exam.

Watch the **"BEST"** and **"MOST likely"** phrasing. Several options are usually technically true and the exam wants the most complete, most immediate, or most appropriate action — which is why "contain" beats "eradicate" mid-incident even though you will eventually do both. When two answers are both correct, ask which one you would do *first*.

## After you pass

Check the [official CompTIA Security+ page](https://www.comptia.org/certifications/security) for current pricing, voucher options, and the exam objectives PDF — the objectives document is free and is the definitive scope statement.

Security+ is valid for three years and renews through continuing education. From here the common paths are CySA+ for blue-team and SOC work, PenTest+ for offensive security, or — once you have a few years of experience — the [CISSP](/exams/cissp) for security leadership.
