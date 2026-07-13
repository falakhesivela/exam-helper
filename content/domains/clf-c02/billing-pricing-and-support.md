---
description: "Billing, Pricing, and Support is 16% of the CLF-C02 — the smallest domain, the most mechanical, and therefore the cheapest marks on the exam."
---

## What this domain actually tests

The smallest domain, the most mechanical, and consequently **the best value study time on the entire exam**. There is almost no reasoning here — it is a set of fixed facts, and fixed facts can simply be learned.

**The EC2 pricing models**, mapped to workload shapes:

- **On-Demand** — pay as you go, no commitment. Spiky and unpredictable workloads.
- **Reserved Instances / Savings Plans** — commit for one or three years, get a large discount. Steady, predictable baseline load.
- **Spot** — deeply discounted spare capacity that AWS can reclaim at short notice. Fault-tolerant, interruptible work.
- **Dedicated Hosts** — a physical server to yourself, usually for software licensing reasons.

**The support plans**, in ascending order: Basic, Developer, Business, Enterprise.

## The traps

**The Technical Account Manager question.** If a scenario mentions a **TAM**, the answer is **Enterprise**. This is the single most reliable fact in the domain and it appears constantly.

**Business is where 24/7 phone and chat support to a Cloud Support Engineer begins**, along with full Trusted Advisor checks. Developer gets you business-hours email support only. Questions describe a company's support needs and expect you to pick the cheapest tier that satisfies them — note the *cheapest*, not the best.

**Cost Explorer versus Budgets.** Explorer *analyses spend that has already happened*. Budgets *alerts you before you overspend*. If the requirement is to be warned when you approach a threshold, it is Budgets.

**Pricing Calculator versus Cost Explorer.** The Pricing Calculator estimates a workload you **have not built yet**. Cost Explorer analyses one you are **already paying for**. A question about estimating the cost of a proposed migration is the Calculator.

**Trusted Advisor versus the Well-Architected Tool.** Trusted Advisor runs automated checks against your *live account* and flags issues. The Well-Architected Tool is a structured self-review questionnaire. Both sound like "AWS tells you what's wrong," and the exam knows it.

**Consolidated billing is an Organizations feature**, and it produces volume discounts across the accounts in an organisation.

## How to study it

Two evenings, and treat it as pure memorisation — because it is.

Evening one: the four pricing models and which workload shape each fits. Evening two: the support tiers and the tool pairs above.

Then make it the *last* thing you review before the exam. This material is stable, mechanical, and easily forgotten, so it benefits from being fresh — and unlike the service catalogue, there is nothing to reason your way back to if it has faded.

At 16% of the exam, this domain is worth roughly ten questions. Every one of them is winnable by someone who spent two evenings on it, and it is genuinely surprising how many candidates arrive without having done that.
