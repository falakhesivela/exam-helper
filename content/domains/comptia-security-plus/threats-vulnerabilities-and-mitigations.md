---
description: "Threats, Vulnerabilities, and Mitigations is 22% of Security+ SY0-701 — the second-biggest domain, and the one that asks symptom-first rather than definition-first."
---

## What this domain actually tests

The second-heaviest domain, and the most scenario-driven on the exam.

**The exam's signature move is symptom-first.** It does not ask "define smishing." It says: *"An employee receives a text message appearing to come from the CEO, asking them to urgently purchase gift cards…"* and asks what is happening.

That changes how you must study. **If your notes are a list of definitions, you are preparing for a test this exam does not give.** You need to go from *indicator* to *attack name* to *mitigation*, and you need to do it in the direction the exam asks.

## The traps

**Build the material as symptom → attack → mitigation triples:**

| Symptom in the stem | Attack | Mitigation |
|---|---|---|
| Text message impersonating an executive | Smishing | Awareness training, out-of-band verification |
| Phone call impersonating IT support | Vishing | Awareness training, callback procedures |
| Email targeting one senior executive | Whaling | Awareness training, email filtering |
| Login form errors when input contains `'` | SQL injection | Parameterised queries, input validation |
| Script runs in another user's browser session | XSS | Output encoding, CSP |
| Action performed as a logged-in user without consent | CSRF | Anti-forgery tokens |
| Traffic silently intercepted and altered | On-path (MITM) | TLS, certificate pinning |
| Malware spreading with **no user action** | Worm | Segmentation, patching |
| Malware hiding itself at kernel level | Rootkit | Secure boot, integrity monitoring |

**Worm versus virus** is the classic pair: a **worm self-propagates** across a network with no user interaction; a **virus** needs a user to run something. The phrase "with no user interaction" in a stem is the tell.

**Vulnerability scan versus penetration test.** A scan *finds and reports* weaknesses. A pen test *actively exploits* them to prove impact. If the requirement is to demonstrate what an attacker could actually achieve, it is a pen test — and it requires written authorisation, which is itself examinable.

**Risk, threat, and vulnerability are three different words.** A **vulnerability** is the weakness. A **threat** is what might exploit it. **Risk** is the likelihood and impact of that happening. The exam uses them precisely and swaps them to catch you.

## How to study it

**Study by symptom, not by definition.** For each attack, write down what a *user or a log* would actually report — then work backwards to the name.

Then build the mitigation half, because the exam frequently asks it as a pair: it describes an attack and asks which control prevents it. Knowing that XSS exists is worth nothing if you cannot say "output encoding."

Give this domain two full weeks. It is 22% of the exam, everything downstream borrows its vocabulary, and it is the domain where the symptom-first framing punishes passive reading most severely.
