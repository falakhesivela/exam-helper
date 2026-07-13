---
description: "Configuration Management and IaC is 17% of the DOP-C02 — CloudFormation at scale, StackSets, drift, and the update behaviours that destroy your data."
---

## What this domain actually tests

CloudFormation, but at a scale the associate exams never approach.

**StackSets** are the answer to "deploy this to every account in the organisation." Know that they can be **organisation-managed** through AWS Organizations and deploy automatically to entire OUs, including to new accounts as they are created. If a question describes a governance baseline that must land in every existing *and future* account, that is the shape.

Then the mechanics that separate people who have used CloudFormation from people who have read about it: **nested stacks**, **custom resources** (a Lambda that CloudFormation calls to do something it cannot do natively), **change sets** (preview what an update will do before you do it), and **drift detection**.

## The traps

**Update behaviours, and what happens to your data.** This is the domain's most consequential fact. Changing a property on a resource can produce one of three outcomes:

- **No interruption** — updated in place, nothing stops.
- **Some interruption** — the resource restarts.
- **Replacement** — CloudFormation creates a **new physical resource with a new ID and deletes the old one.**

Replacement is the one that matters. Change the wrong property on an RDS instance or an EC2 instance and the original is destroyed. Questions ask, in effect, "what happens to the database when we change this?" and expect you to know that some changes are silently catastrophic.

**Deletion policies.** `DeletionPolicy: Retain` and `Snapshot` are how you protect stateful resources from a stack teardown. If a requirement says data must survive stack deletion, look for these.

**Drift is detection, not correction.** CloudFormation tells you that reality no longer matches the template. It does not fix it. Options implying drift detection auto-remediates are wrong — that is Config's job.

**SAM is a transform, not a separate service.** It expands into plain CloudFormation. Understanding that stops a whole category of confusion.

## How to study it

Write a stack, deploy it, then **change a property that forces replacement** and watch CloudFormation delete and recreate the resource. Doing this once — ideally on something with data in it, in a sandbox account — permanently teaches you to check update behaviour before shipping. It is the kind of lesson that only lands when it costs you something.

Then run a **change set** before an update and read what it says. Then deliberately modify a resource in the console and run **drift detection** to see it caught.

Finally, deploy a **StackSet to an OU**. Multi-account is the thing that makes this a professional-level domain, and it is the part you cannot fake.
