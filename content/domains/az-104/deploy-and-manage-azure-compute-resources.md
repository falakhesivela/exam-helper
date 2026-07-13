---
description: "Deploy and Manage Azure Compute Resources is 25% of AZ-104 — the biggest domain. VMs, scale sets, availability sets versus zones, and App Service deployment slots."
---

## What this domain actually tests

The largest domain on the exam by weight: virtual machines and the machinery around them.

**Availability sets versus availability zones** is the distinction that carries the most marks:

- An **availability set** spreads VMs across **fault domains** (different racks, power, network) and **update domains** (patched at different times) — but all **within one datacentre**. It protects against rack failure and maintenance reboots.
- **Availability zones** spread VMs across **physically separate datacentres** in the region. They protect against a whole datacentre failing.

**Zones give the higher SLA.** If the requirement is surviving a datacentre outage, a set is not enough.

Then **Virtual Machine Scale Sets** with autoscaling rules, and **App Service plans** — where the pricing tier determines what you get (custom domains, SSL, scaling, slots).

## The traps

**Deployment slots are the zero-downtime answer.** An App Service slot is a fully functioning copy of your app at a different endpoint. You deploy to staging, warm it up, verify it, then **swap** — and the swap is near-instant and reversible. If a question asks how to deploy with no downtime *and* the ability to roll back immediately, it is a slot swap. Options describing a rolling restart are inferior and are there to catch you.

**Disk types matter and are examined.** Standard HDD, Standard SSD, Premium SSD, and Ultra Disk. Requirements mentioning consistent low latency or high IOPS eliminate the standard tiers. Also know that **the OS disk and data disks are separate** and that resizing a VM can change what disk types are available to it.

**Scale sets scale, availability sets do not.** They are different tools solving different problems, and their similar names invite confusion. A scale set gives you elasticity *and* fault tolerance; an availability set gives you fault tolerance only.

**Resizing a VM usually requires a restart**, and some size changes require the VM to be deallocated first (because the target size lives in a different hardware cluster). Questions about changing VM size sometimes hinge on whether downtime is acceptable.

**Not every App Service tier supports slots.** The free and shared tiers do not. If a scenario needs slots, the plan must be Standard or above.

## How to study it

Deploy a VM, then a scale set behind a load balancer, then trigger the autoscale rule by loading it. Watch instances appear.

Then create an App Service with a staging slot, deploy a change to staging, and swap. Then swap *back*. That five-minute exercise is the answer to a recurring exam question and you will never forget it once you have done it.

Finally, write the sets-versus-zones distinction on a card, with what each protects against. At 25% of the exam this is the biggest domain, but it is also the most conventional — there are fewer nasty surprises here than in networking, and honest hands-on time converts directly into marks.
