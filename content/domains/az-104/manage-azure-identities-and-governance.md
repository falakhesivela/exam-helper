---
description: "Manage Azure Identities and Governance is 20% of AZ-104 — RBAC scope and inheritance, the Contributor limitation, and the edge cases the exam actually probes."
---

## What this domain actually tests

Everyone knows RBAC basics. **The exam probes the edges**, and that is where candidates who "basically know RBAC" quietly bleed points.

**The four built-in roles, and the one fact that separates them:**

- **Owner** — everything, *including granting access to others*.
- **Contributor** — everything **except granting access**.
- **Reader** — view only.
- **User Access Administrator** — *only* granting access.

**"Contributor cannot assign roles"** is a reliable exam fact and a reliable trap. A scenario where someone needs to manage resources *and* grant a colleague permission requires Owner or User Access Administrator, not Contributor.

**Scope and inheritance.** Assignments can be made at management group, subscription, resource group, or resource level, and they **inherit downward**. An assignment at the subscription applies to every resource group inside it.

## The traps

**Azure roles versus Entra roles.** Azure roles control access to **resources**. Entra roles control access to **identity administration** — creating users, managing groups, assigning licences. **Being Owner on a subscription grants you nothing inside Entra ID itself.**

**A resource lock beats RBAC.** A `CanNotDelete` lock stops even an Owner from deleting the resource. If a question asks how to prevent deletion of a critical resource *even by administrators*, the answer is a lock, not a role change. The exam likes this precisely because it breaks the intuition that Owner is absolute.

**Dynamic groups need a licence.** Membership from a rule over user attributes (department, job title) is a **P1** feature. So is self-service password reset for cloud users, and conditional access. Questions describe a capability and ask what is required — and the answer is sometimes a licence, not a configuration.

**Attributes change, membership changes.** With a dynamic group, if a user's department is updated, they are added to or removed from the group automatically. That is the point of them, and it is a question.

**Management groups organise subscriptions.** If a policy must apply to *many subscriptions*, it is assigned at the management group level, not repeated per subscription.

## How to study it

Drill these as flashcards rather than reading them. They are memorisable, they are stable across exam revisions, and they are exactly what gets asked.

Start with a single card: *"Contributor cannot do what?"* If the answer does not come instantly, this domain is not yet safe for you.

Then build the scope ladder — management group → subscription → resource group → resource — and practise answering "where should this assignment be made?" for a handful of requirements. The right answer is almost always *the highest scope that covers exactly what is needed and nothing more*, which is least privilege applied to placement rather than permissions.
