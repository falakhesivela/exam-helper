---
description: "Security Architecture and Engineering is 13% of the CISSP — security models, cryptography at an architectural level, and non-repudiation."
---

## What this domain actually tests

Security models, secure design principles, cryptography, and physical security — all at an **architectural** level. You are not implementing; you are choosing and justifying.

**Cryptography is about which mechanism provides which property**, not about maths:

| Property | Provided by |
|---|---|
| **Confidentiality** | Encryption |
| **Integrity** | Hashing |
| **Authentication** | Digital signature, MAC |
| **Non-repudiation** | **Digital signature only** |

**Only a digital signature provides non-repudiation**, because only the signer holds the private key and therefore cannot later deny having signed. A MAC provides integrity and authentication but *not* non-repudiation, because both parties share the key — either could have produced it. That distinction is a favourite.

**Which key does what:** encrypt with the **recipient's public key** (confidentiality); sign with **your own private key** (non-repudiation).

## The traps

**Key management matters more than algorithms.** The exam rarely asks you to compare AES to 3DES. It asks how keys are generated, distributed, stored, rotated, escrowed, and destroyed — because that is where real systems fail, and it is a management concern.

**The security models** appear by name and are worth learning as one-liners:

- **Bell-LaPadula** — **confidentiality**. *No read up, no write down.* Military classification.
- **Biba** — **integrity**. *No read down, no write up.* (The mirror image.)
- **Clark-Wilson** — integrity through well-formed transactions and separation of duties.
- **Brewer-Nash (Chinese Wall)** — prevents conflicts of interest.

Bell-LaPadula is confidentiality, Biba is integrity. If you remember only one thing, remember that pair — and that they are opposites.

**Secure design principles.** Defence in depth, least privilege, separation of duties, **fail-secure versus fail-safe** (fail-*secure* protects the *asset* by defaulting to locked; fail-*safe* protects *people* by defaulting to open — and on the CISSP, **human safety always wins**, so a fire exit fails open).

**Physical security is in scope** and candidates forget it. Mantraps, bollards, lighting, CPTED, and fire suppression. Remember: for **any** question involving fire or physical danger, **evacuate people first**.

## How to study it

Learn the four models as one-line cards. Then learn the property table above — and specifically, be able to say *why* a MAC does not give non-repudiation.

Then, for physical security, remember the single rule that overrides everything: **life safety first.** It resolves more questions here than any technical knowledge.
