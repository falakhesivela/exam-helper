---
description: "Setting up a Cloud Solution Environment is 22% of the GCP ACE — the resource hierarchy and IAM inheritance, which is the single most-tested concept on the exam."
---

## What this domain actually tests

**The resource hierarchy is the single most-tested concept on the ACE**, and it is where engineers coming from AWS lose the most marks — because their instincts are actively wrong here, not merely absent.

> **organisation → folders → projects → resources**

The **project** is the fundamental unit of billing, quota, API enablement, and isolation. Google does not use accounts as an isolation boundary the way AWS does. A question asking "how do you give the team access to the dev environment?" expects project-level thinking.

**IAM policies attach at any level and inherit downward — and they are additive.**

## The traps

### There are no deny rules

This is the big one, and it deserves the space.

In AWS, an explicit `Deny` always wins. In Google Cloud IAM, **policies are purely additive down the hierarchy.** A role granted at the folder level **cannot be revoked at the project below it.** You cannot "deny it back."

So if an option says "add a deny policy at the project level to restrict this access," it is wrong — that is AWS thinking transplanted into a Google question. The correct answer is to **grant the role at the appropriate level in the first place**, or to remove it from where it was granted.

Coming from the AWS model, this inversion produces more wrong answers than any other single thing on the exam.

### Primitive roles are almost always the wrong answer

- **Primitive** roles — Owner, Editor, Viewer. Broad, legacy, and blunt.
- **Predefined** roles — per-service, least-privilege. **Usually the right answer.**
- **Custom** roles — when no predefined role fits.

If an option grants **Editor at the project level**, be immediately suspicious. Least privilege is the exam's default value, and a primitive role almost never satisfies it.

### Service accounts are two-sided

In AWS you attach a role to an instance and you are done. In Google, a VM **runs as** a service account — *and* you separately control **which humans may impersonate or deploy as** that service account (the `iam.serviceAccountUser` role).

Questions probe **both** sides, and AWS engineers reliably answer only the first.

## How to study it

Spend your first week **explicitly unlearning the AWS model**. Write down, in your own words: *policies are additive, there is no deny, and a folder-level grant cannot be taken away below.* Sit with it until it stops feeling wrong.

Then practise placing grants. Given a requirement, ask *at what level should this role be granted?* — and remember that granting too high is not just untidy, it is unrevocable further down.

Finally, learn `gcloud projects add-iam-policy-binding` and the `gcloud config set project` context switch. Both appear more often than anyone expects.
