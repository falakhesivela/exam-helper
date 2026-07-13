---
description: "Identity and Access Management is 13% of the CISSP — the access control models, federation protocols, and the IAAA sequence."
---

## What this domain actually tests

Who you are, what you may do, and how we prove both.

**IAAA**, in order — and the order matters, because the exam asks which stage a control belongs to:

1. **Identification** — claiming an identity (a username).
2. **Authentication** — proving it (a password, token, biometric).
3. **Authorisation** — what that identity may do.
4. **Accountability** — logging what it did (auditing).

**The three authentication factors:** something you **know** (password), something you **have** (token, smartcard), something you **are** (biometric). *Multi-factor* means factors from **different categories** — a password and a security question are both "something you know" and therefore **not** multi-factor. That is a favourite trap.

## The traps

### The access control models

Learn these as one-liners with their canonical use case:

| Model | Who decides | Typical use |
|---|---|---|
| **DAC** | The **owner** of the resource | Standard file systems |
| **MAC** | The **system**, via labels and clearances | Military, classified data |
| **RBAC** | Permissions attach to a **job role** | Most enterprises |
| **ABAC** | Decisions from **attributes and context** (time, location, device) | Modern, dynamic environments |

**MAC is the rigid one**: users cannot change permissions, the system enforces labels. If a scenario mentions classification levels and clearances, it is MAC. If it mentions job functions, it is RBAC.

### The biometric error rates

- **FRR** (False Rejection Rate) — a legitimate user is **wrongly denied**. Type I error. Annoying.
- **FAR** (False Acceptance Rate) — an impostor is **wrongly accepted**. Type II error. **Dangerous.**
- **CER** (Crossover Error Rate) — where FRR and FAR are equal. **Lower CER means a better system**, and it is the standard comparison metric.

The exam asks which error is worse: **FAR**, always, because it lets the wrong person in.

### Federation and SSO

**SAML** (XML-based, enterprise SSO), **OAuth 2.0** (**authorisation**, not authentication — delegated access), **OpenID Connect** (an **authentication** layer on top of OAuth), and **Kerberos** (tickets, a KDC, and a hard dependency on **synchronised clocks** — which is why time skew breaks Kerberos and is a question).

**OAuth is authorisation, OIDC is authentication.** People state this backwards constantly.

## How to study it

Build the model table and drill it against scenarios. Then learn the biometric rates, and specifically that **FAR is the dangerous one** and **lower CER is better**.

Then get OAuth versus OIDC straight in a single sentence. If you can explain why "sign in with Google" needs OIDC rather than plain OAuth, you have it.
