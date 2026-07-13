---
description: "Security and Compliance is 25% of the CLF-C02, and it is dominated by one idea: the shared responsibility model. What it tests, the boundary cases, and how to study it."
---

## What this domain actually tests

A quarter of the exam, and it is dominated by a single idea that you can learn properly in one focused session:

**AWS is responsible for security *of* the cloud.** The hardware, the facilities, the physical network, and patching the managed services.

**You are responsible for security *in* the cloud.** Your data, your IAM users and permissions, your security-group rules, your encryption choices, and patching the guest operating system on any EC2 instance you launched.

Knowing the slogan is not enough, because **the exam probes the boundary**, not the middle. It asks the awkward cases specifically, and that is where the marks are won or lost.

## The traps

**The patching boundary is the classic.** Work through these until they are automatic:

- Who patches the operating system on an **EC2 instance**? *You do.* You launched it; it is yours.
- Who patches the operating system underneath **RDS**? *AWS does.* It is a managed service — you never see the OS.
- Who patches the **hypervisor**? *AWS.*
- Who applies **security patches to your application code**? *You.*

The rule that generalises: the more managed the service, the more AWS takes on. Draw the line at whether you can log into it.

**The non-technical responsibilities are still yours.** Classifying your data, deciding who gets access, and configuring your services correctly are all your job. AWS securing the datacentre does not mean AWS secured your S3 bucket — you left it public.

**IAM basics get tested lightly but reliably.** Users, groups, roles, policies. Enable MFA on the root account and then stop using it for daily work. The root account should not be used to do anything routine, and questions phrase this as best practice.

**Artifact is the compliance-report service.** If a question asks where you download a SOC 2 or ISO compliance report, it is AWS Artifact. It appears, and nobody expects it.

## How to study it

Give the shared responsibility model **its own dedicated study session** — not fifteen minutes bolted onto a service-catalogue day. It is a quarter of the exam.

Then build a two-column list. On the left, everything AWS does. On the right, everything you do. Deliberately populate it with the *hard* cases — the ones where a managed service moves the line — rather than the obvious ones. Physical security is obviously AWS; guest OS patching on EC2 is the one people get wrong.

Finally, when you meet a question in practice, ask yourself one thing: *can I log into it?* If yes, securing it is probably your job. If no, it is probably AWS's. That heuristic is not perfect, but it will get you through most of this domain.
