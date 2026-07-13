---
description: "General Security Concepts is 12% of Security+ SY0-701 — the smallest domain, mostly cryptography. The two sentences about keys that collapse a whole class of questions."
---

## What this domain actually tests

The smallest domain, and it is mostly **cryptography** — but there is no maths on this exam. What you need is to know **which tool solves which problem**.

**The tools:**

- **Symmetric** encryption (AES) — fast, one shared key. Used for bulk data.
- **Asymmetric** encryption (RSA, ECC) — slow, uses a key *pair*. Used to exchange a symmetric key, and to sign.
- **Hashing** (SHA-256) — **one-way**. Proves **integrity**. Cannot be reversed.
- **Digital signature** — hash the message, encrypt the hash with your **private key**. Provides integrity, authentication, and **non-repudiation** together.

## The traps

### Which key does what

This is the confusion the exam exploits above all others, and getting it straight collapses an entire class of questions. Two sentences:

> **You encrypt with the recipient's *public* key.** Only they can decrypt it — with their private key. This gives **confidentiality**.
>
> **You sign with your *own private* key.** Anyone can verify it with your public key. This gives **integrity, authentication, and non-repudiation**.

If you have those two sentences, you can answer almost any "which key" question by asking what the goal is: keeping it secret (recipient's public key) or proving it came from you (your private key).

**Only a digital signature provides non-repudiation.** Because only you hold your private key, you cannot later deny signing. Hashing alone does not do this. Encryption alone does not do this. If a question mentions non-repudiation, look for the signature.

**Encryption versus hashing.** Encryption is **reversible with a key** (confidentiality). Hashing is **one-way** (integrity). A question about verifying a downloaded file has not been tampered with wants a **hash**, not encryption.

**Salting** defends stored password hashes against rainbow tables. It does not encrypt anything.

### The control types

Two independent axes, and the exam asks both:

- **By function:** preventive, detective, corrective, deterrent, compensating.
- **By category:** technical, managerial, operational, physical.

A security guard is *physical* and *deterrent*. A firewall is *technical* and *preventive*. A log review is *technical* and *detective*. A policy is *managerial*.

**The CIA triad** — confidentiality, integrity, availability — underpins everything, and questions ask which one an attack or control affects.

## How to study it

Write the two key sentences on a card. Read them until they are boring. That card is worth more marks than any other single artefact in this domain.

Then build a small grid of the control types and classify twenty real controls into it — that exercise is quick and the questions are direct.

At 12% this is the smallest domain, so do not over-invest. But it underpins the architecture domain later, and getting the cryptography clear in week one pays interest for the rest of your preparation.
