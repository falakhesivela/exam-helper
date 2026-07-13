---
description: "Describe Azure Management and Governance is 20% of AZ-900 — home of Microsoft's favourite trick pairing: Azure Policy versus RBAC."
---

## What this domain actually tests

The governance tooling, and it contains **the single most reliable trick pairing on the entire AZ-900**.

Learn this and you have most of the domain:

| Tool | What it controls |
|---|---|
| **Azure Policy** | **What** can be deployed |
| **RBAC** | **Who** can do things |
| **Resource locks** | Stop **anyone** — even an Owner — deleting or changing a resource |

**Azure Policy versus RBAC** is offered as a choice constantly, and both options will look defensible. The rule:

- If the scenario is about **enforcing a standard on resources** — "all resources must be tagged with a cost centre," "no VM larger than a D4 may be created," "only these regions are allowed" — it is **Policy**.
- If it is about **granting a person permission** — "Sam needs to be able to restart VMs in this resource group" — it is **RBAC**.

They are not alternatives to each other. They answer different questions, and the exam is checking whether you know which question is being asked.

## The traps

**A resource lock beats RBAC.** A `CanNotDelete` lock stops even a subscription Owner from deleting the resource. That is precisely why the exam likes them: they break the intuition that Owner can do anything. If a question asks how to prevent accidental deletion of a critical resource *even by administrators*, it is a lock.

There are two types — `CanNotDelete` (you can read and modify, but not delete) and `ReadOnly` (you can read, but not modify or delete).

**Policy prevents; a lock protects what already exists.** Policy stops the wrong thing being *created*. A lock stops an existing thing being *destroyed*. Questions that describe preventing something from ever being deployed want Policy.

**The three cost tools are distinct.** The **Pricing Calculator** estimates a workload you have not built yet. The **TCO Calculator** compares your *on-premises* costs against Azure. **Cost Management** analyses and budgets spend you are *already incurring*. A question about justifying a migration financially is the TCO Calculator.

**Tags are how you organise cost**, and Policy is how you *enforce* that things get tagged. Those two show up together.

## How to study it

Give the Policy-versus-RBAC distinction its own session and drill it as scenarios rather than definitions. Write ten one-line requirements and force yourself to label each one Policy or RBAC. That exercise is worth more than reading the documentation for either.

Then learn the lock behaviour, because it is counter-intuitive and therefore memorable once it clicks: *the lock wins, even against an Owner.*

At 20% of the exam this is a small domain built on a handful of clean distinctions — which makes it some of the most reliable marks available to you.
