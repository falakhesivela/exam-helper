---
description: "Hardware is 25% of A+ Core 1 — the classic domain. RAID levels, storage interfaces, and the spec lists you simply have to memorise."
---

## What this domain actually tests

The second-largest domain and the classic A+ content: motherboards, CPUs, RAM, storage, power, cooling, and BIOS/UEFI.

It is not conceptually hard. It is a **memorisation** domain, and refusing to accept that is a common way to fail it.

## The traps

### RAID levels

Reliably tested, easily learned, and free marks:

| RAID | What it does | Min disks | Survives |
|---|---|---|---|
| **0** | Striping — speed, **no redundancy** | 2 | Nothing. One disk dies, all data is lost. |
| **1** | Mirroring — full redundancy, half usable capacity | 2 | One disk failure |
| **5** | Striping with distributed parity | 3 | **One** disk failure |
| **10** | Mirrored pairs, striped — speed *and* redundancy | 4 | One disk per mirrored pair |

The trap: **RAID 0 provides no redundancy at all.** It is purely for speed, and candidates who see "RAID" and think "safe" get it wrong. Also note RAID 5 survives exactly **one** disk failure — two simultaneous failures destroy the array.

### Storage interfaces

**HDD** (mechanical, cheap, slow), **SSD** (no moving parts, fast), **NVMe** (SSD over PCIe — much faster than SATA SSD). Form factors: **SATA** (the cable) versus **M.2** (the slot). An M.2 drive can be either SATA or NVMe, which is exactly the sort of detail the exam enjoys.

If a scenario asks for the fastest storage, it is **NVMe**.

### RAM

**DDR4 versus DDR5 are not interchangeable** — different notch positions, different slots. **DIMM** (desktop) versus **SO-DIMM** (laptop). Questions describe an upgrade and ask what will physically fit.

### The spec lists

These are pure recall and they are the fastest marks on the exam. Drill them as flashcards from day one:

- **USB** generations and their speeds
- **Display connectors** — DisplayPort, HDMI, DVI, VGA
- **Ethernet cable categories** — Cat 5e, Cat 6, Cat 6a — with speeds and maximum distances
- **CPU socket types** and what distinguishes them

## How to study it

**Open a real PC.** Reading about RAM slots produces weak memories; physically identifying a DIMM, an M.2 slot, a PSU connector, and a PCIe slot produces strong ones. One old desktop covers most of this domain, and an hour with a screwdriver beats a day of reading.

For what you cannot touch — server RAID arrays especially — watch a short video.

Then treat the spec lists as **spaced-repetition flashcards, ten minutes daily**, rather than something to read through. Spaced practice turns an impossible-looking list into automatic recall in about three weeks, and these questions are the most certain marks available anywhere on Core 1.

At 25% of the exam, this domain plus troubleshooting is over half your score.
