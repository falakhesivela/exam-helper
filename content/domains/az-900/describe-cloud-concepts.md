---
description: "Describe Cloud Concepts is 25% of AZ-900 — the vendor-neutral quarter. Service models, CapEx vs OpEx, and the benefit vocabulary Microsoft tests precisely."
---

## What this domain actually tests

The vendor-neutral quarter of the exam: what cloud *is*, before any Azure product appears.

**The service models**, with Azure examples attached — this is how the exam asks them:

- **IaaS** — you manage the OS and everything above it. *Virtual Machines.*
- **PaaS** — you manage only your application. *App Service.*
- **SaaS** — you manage nothing. *Microsoft 365.*

Then the deployment models (public, private, hybrid), and the economic argument: **CapEx versus OpEx**. Buying servers up front is capital expenditure. Paying monthly for cloud consumption is operational expenditure. The cloud pitch is the shift from the first to the second, and this appears as a straight question.

## The traps

**The benefit vocabulary is tested precisely, and the terms are not synonyms.** This is where people casually lose marks, because in ordinary speech these words overlap and on the exam they do not:

- **Scalability** — the ability to *add* capacity.
- **Elasticity** — adding *and removing* it **automatically**, in response to demand.
- **Agility** — how *fast* you can deploy new resources.
- **High availability** — staying up *during* a failure.
- **Disaster recovery** — coming back *after* one.

A question describing an application that automatically grows and shrinks with traffic is testing **elasticity**, not scalability. A question about deploying a new environment in minutes is **agility**. The exam swaps these between stem and options deliberately.

**Shared responsibility shifts with the service model**, and this is worth pausing on. Under **IaaS** you patch the operating system. Under **PaaS** Microsoft does. Under **SaaS** you are responsible for essentially nothing but your data and who can access it. The exam asks who patches what, and the answer depends entirely on which model the scenario names.

**Consumption-based pricing** is a concept, not just a fact. It means you pay for what you use, which is what makes the OpEx argument work in the first place.

## How to study it

This is definitional material, and definitions respond to flashcards rather than reading. One or two sessions is genuinely enough.

Spend the time on the benefit vocabulary specifically. Write each term and, next to it, the *one-sentence scenario* that would signal it. "Traffic doubles at lunchtime and the app grows automatically" → elasticity. "A datacentre floods and the app keeps serving" → high availability. Building that mapping is what converts a fuzzy list into exam marks.

And note that day-one concepts do not stay in the day-one domain — they appear *inside* questions on every other topic, which is why 25% of the exam sits on material you might be tempted to skim.
