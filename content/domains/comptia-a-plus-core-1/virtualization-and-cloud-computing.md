---
description: "Virtualization and Cloud Computing is 11% of A+ Core 1 — the smallest domain, definition-level only. Do not over-invest in it."
---

## What this domain actually tests

The smallest domain on Core 1, and it is **definition-level only**. This is the one place on the exam where the correct study strategy is genuinely "learn a little and move on."

**Hypervisor types**, which is the most-tested item:

- **Type 1 (bare metal)** — runs directly on the hardware, with no host OS underneath. VMware ESXi, Microsoft Hyper-V, Citrix XenServer. Used in datacentres. **Faster and more efficient**, because there is no host OS in the way.
- **Type 2 (hosted)** — runs as an application *on top of* a host operating system. VirtualBox, VMware Workstation. Used on desktops for testing and development.

If a scenario describes a server room running many VMs, it is Type 1. If it describes a developer running a test VM on their laptop, it is Type 2.

**Cloud models** — IaaS, PaaS, SaaS — at a recognition level, plus the cloud characteristics: shared responsibility, measured service (you pay for what you use), rapid elasticity, on-demand self-service, and resource pooling.

**Client-side virtualisation requirements**: enough RAM and CPU cores, sufficient storage, and — the detail worth knowing — **hardware virtualisation support enabled in BIOS/UEFI** (Intel VT-x or AMD-V). If a scenario says a VM will not start or runs unbearably slowly, that BIOS setting is a likely culprit.

## The traps

**Type 1 versus Type 2 is the whole domain's centre of gravity.** Get the "bare metal versus on top of a host OS" distinction exactly right and you have most of the available marks.

**Virtualisation support must be enabled in BIOS.** It is often off by default. This appears as a troubleshooting question and it is the answer people do not think of.

**Resource requirements are per-VM.** Each virtual machine needs its own allocation of RAM and disk. A host with 8 GB cannot comfortably run four VMs each wanting 4 GB, and questions do this arithmetic.

**Do not confuse virtualisation with cloud.** Virtualisation is the *technology*; cloud is a *delivery model built on top of it*. The exam keeps them separate.

## How to study it

**Install VirtualBox and create one virtual machine.** That is genuinely the whole practical component. You will see the RAM and CPU allocation screens, and if virtualisation is disabled in your BIOS, you will hit that error yourself and never forget it.

Then learn the Type 1 / Type 2 distinction and the three cloud models. Two hours, total.

**And then stop.** At 11%, this is roughly ten questions, all of them shallow. Candidates with a cloud background sometimes go deep here because it is familiar and interesting — and that time would be far better spent on troubleshooting or hardware, which together are more than half the exam. The weighting does not justify the investment, and knowing when *not* to study something is a real exam skill.
