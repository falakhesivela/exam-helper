---
description: "Describe Azure Identity, Access, and Security is 20% of AZ-900 — Entra ID, conditional access, Zero Trust, and the Azure-roles-versus-Entra-roles boundary."
---

## What this domain actually tests

Identity first, security second.

**Microsoft Entra ID** (formerly Azure AD) is the identity service — users, groups, and application registrations. And here is a distinction the exam tests deliberately: **Entra ID is not "Active Directory in the cloud."** It is a different thing. On-premises Active Directory is a directory service using LDAP and Kerberos, organised into domains, forests, and organisational units. Entra ID is an identity provider for cloud applications, using modern protocols, with no OUs or group policy. They can be synchronised, but they are not the same product and the exam will not let you pretend otherwise.

Then **multi-factor authentication** and **conditional access** — policies that grant or block access based on signals like user location, device compliance, and sign-in risk. Conditional access is how Zero Trust is actually implemented in Azure, and the two come up together.

**Zero Trust** appears by name, with its three principles: verify explicitly, use least-privilege access, assume breach.

## The traps

**Azure roles versus Entra roles.** The boundary is real and it is examined:

- **Azure roles (RBAC)** control access to **Azure resources** — VMs, storage accounts, resource groups.
- **Entra roles** control access to **identity administration** — creating users, managing groups, assigning licences.

Being **Owner on a subscription grants you nothing inside Entra ID itself.** That is the trap in one sentence, and it catches people who assume Owner means omnipotent.

**Defender for Cloud is posture and threat protection.** It assesses your security configuration and gives you a secure score, and it detects threats. If a question asks how to see how secure your environment currently is, that is Defender for Cloud.

**Key Vault stores secrets, keys, and certificates.** If credentials, connection strings, or certificates appear in a scenario, Key Vault is the answer to where they should live — not in configuration files, and not in code.

**Authentication versus authorisation.** *Who you are* versus *what you are allowed to do*. MFA strengthens the first. RBAC governs the second. The exam uses the words precisely.

## How to study it

Draw the boundary between Azure roles and Entra roles explicitly, with examples on each side. Then say out loud: *"Subscription Owner cannot create users."* If that sentence feels wrong, sit with it until it doesn't — that discomfort is exactly the gap the exam is probing.

Then learn conditional access as *the mechanism*, not just a term: signals in, decision out (grant, block, or require MFA). Questions describe a security requirement — "users signing in from outside the corporate network must complete MFA" — and expect you to name it.

Twenty percent of the exam sits on a compact set of ideas here. It is dense, but it is finite.
