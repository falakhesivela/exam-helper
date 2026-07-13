---
description: "Network Troubleshooting is 24% of Network+ N10-009 — nearly a quarter of the exam. The methodology in order, the tools, and why documentation comes last."
---

## What this domain actually tests

Nearly a quarter of the exam, and the most scenario-driven domain on it.

**CompTIA's troubleshooting methodology, in order** — and they test the sequence explicitly:

1. **Identify the problem**
2. **Establish a theory** of probable cause
3. **Test the theory** to determine the cause
4. **Establish a plan of action** and implement the solution
5. **Verify** full system functionality and implement preventive measures
6. **Document** findings, actions, and outcomes

## The traps

**Documentation is LAST, and verification comes BEFORE it.** This is where candidates lose marks that cost nothing to keep. If a question describes a fix that appears to have worked and asks what you do next, the answer is **verify full functionality** — not "document it and close the ticket."

Get the order wrong and you will confidently pick a wrong answer, because both options look responsible.

**Know which tool answers which question:**

| Tool | Answers |
|---|---|
| `ping` | Is the host reachable at all? |
| `traceroute` / `tracert` | **Where** along the path does it die? |
| `nslookup` / `dig` | Is **DNS** resolving correctly? |
| `ipconfig` / `ifconfig` | What is my own configuration? |
| `netstat` | What connections and ports are open? |
| `arp` | What MAC maps to what IP? |
| **Cable tester** | Is the physical cable good? |
| **Toner probe** | **Which** cable in this bundle is which? |

**The symptom-to-cause classics:**

- Can reach a site by **IP but not by name** → **DNS**.
- Address is **169.254.x.x** (APIPA) → the host **could not reach a DHCP server**.
- Two hosts on the same LAN cannot communicate but each can reach the gateway → check whether they are actually **on the same subnet** (this is really a subnetting question wearing a troubleshooting costume).
- Intermittent slowness on one link → check for **duplex mismatch** or a failing cable.

**"Why can't host A ping host B?"** is the classic frame, and the real question is usually subnet membership or a default gateway. Do the subnetting maths before you theorise about anything more exotic.

## How to study it

**Memorise the six steps as a sequence you can recite**, then practise the "what should the technician do NEXT?" format specifically: read a scenario, identify which step it has reached, name the next one. It is a mechanical drill and it converts directly into marks.

Then learn the tools by the *question they answer* rather than by what they do. "Where does the path break?" → traceroute. "Is DNS the problem?" → nslookup. That framing is how the exam presents them.

Finally, remember that many troubleshooting questions are subnetting questions in disguise. If a scenario involves two hosts that cannot talk to each other, calculate their subnets before doing anything else.

At 24%, this is roughly 21 questions — the second-largest block on the exam, and one that rewards a memorised sequence more than any amount of networking intuition.
