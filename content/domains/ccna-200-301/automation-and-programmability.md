---
description: "Automation and Programmability is 10% of the CCNA 200-301 — the domain everyone under-studies, and some of the easiest marks on the exam."
---

## What this domain actually tests

**The domain everyone under-studies**, because it is newer and feels less "networky" than OSPF and VLANs.

It is **10% of the exam** — roughly ten questions — and it is some of the **easiest material on the paper**. Two solid evenings covers it properly. Skipping it is a self-inflicted wound, and it is enough to fail you on its own if you are borderline elsewhere.

## What you actually need

**REST APIs and HTTP verbs.** Know what each does:

| Verb | Action |
|---|---|
| **GET** | Retrieve |
| **POST** | Create |
| **PUT** | Replace/update |
| **PATCH** | Partially update |
| **DELETE** | Remove |

And the response codes: **200** OK, **201** created, **400** bad request, **401** unauthorised, **403** forbidden, **404** not found, **500** server error.

**JSON structure.** You will be shown a JSON blob and asked a question about it. You need to read it — objects in `{}`, arrays in `[]`, key–value pairs — and identify a value or spot a syntax error. That is genuinely the level. Know how JSON differs from XML and YAML at a glance.

**Controller-based (software-defined) networking.** The key idea: traditional networking configures each device individually; SDN **separates the control plane from the data plane** and centralises the control plane in a **controller**. The controller pushes policy down through a **southbound** interface to the devices, and exposes a **northbound** API (usually REST) to applications and automation tools.

Northbound = toward the applications. Southbound = toward the devices. That pair is examinable.

**Configuration management tools**, at recognition level only:

| Tool | Key trait |
|---|---|
| **Ansible** | **Agentless**, push model, uses SSH, YAML playbooks |
| **Puppet** | Agent-based, pull model |
| **Chef** | Agent-based, Ruby |
| **Terraform** | Provisioning infrastructure (not configuring existing devices) |

**Ansible is agentless** is the single most-tested fact in that table.

## The traps

**"Agentless" belongs to Ansible.** If a question asks which tool requires no software installed on managed devices, that is Ansible.

**Configuration management is not provisioning.** Ansible, Puppet, and Chef *configure* things that exist. Terraform *creates* infrastructure. The exam keeps them distinct.

**Do not confuse the controller with a router.** The controller does not forward traffic; it makes decisions and distributes them.

## How to study it

Two evenings, deliberately scheduled — not a weekend skim after everything else.

Evening one: HTTP verbs, response codes, and reading JSON. Practise by looking at real JSON and answering questions about it.

Evening two: SDN's control-plane/data-plane split, northbound versus southbound, and the tool table.

Ten questions for two evenings of work is the best exchange rate on the entire CCNA. Take it.
