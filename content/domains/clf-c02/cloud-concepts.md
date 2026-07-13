---
description: "Cloud Concepts is 26% of the CLF-C02 — the benefits pitch and the global infrastructure, where precise vocabulary earns free marks. What it tests and how to study it."
---

## What this domain actually tests

Two things: AWS's argument for why cloud is better, and the geography of how AWS is physically laid out.

The benefits are tested in AWS's own framing, so learn their phrasing rather than paraphrasing it: trade capital expense for variable expense, benefit from massive economies of scale, stop guessing capacity, increase speed and agility, stop spending money running datacentres, and go global in minutes.

The geography is where the reliable marks are, and it needs to be **precise**:

- A **Region** is a geographic area (e.g. eu-west-1).
- An **Availability Zone** is one or more discrete datacentres *within* a Region, with independent power and networking.
- An **edge location** is a CloudFront caching site. There are *far* more edge locations than Regions.

Also learn the six pillars of the Well-Architected Framework by name: operational excellence, security, reliability, performance efficiency, cost optimisation, and sustainability.

## The traps

**Region versus Availability Zone.** Endlessly tested and endlessly confused. Deploying across three AZs protects you against a datacentre failure. It does *not* protect you against a Region failing. Multi-AZ is not multi-Region.

**The latency question is always CloudFront.** Any scenario describing global users experiencing slow load times, and a desire to cache content close to them, is asking about **edge locations and CloudFront**. It is not asking you to deploy to more Regions, even though that would also help. This is one of the most reliably recurring question shapes on the whole exam.

**High availability, fault tolerance, elasticity, and scalability are not synonyms.** The exam distinguishes them:
- **Scalability** — the ability to add capacity.
- **Elasticity** — adding *and removing* it automatically as demand changes.
- **High availability** — staying up when something fails.
- **Agility** — how quickly you can deploy new resources.

Questions swap these terms between the stem and the options to see whether you noticed.

**CapEx versus OpEx.** Buying servers up front is capital expenditure. Paying monthly for cloud is operational expenditure. The cloud pitch is the shift from the first to the second, and it is worth a mark or two.

## How to study it

This domain is vocabulary, and vocabulary responds to flashcards, not reading. Two or three focused sessions is genuinely enough.

Spend one of them just on the Region / AZ / edge location distinction, drawing it out until you could explain it to someone else. It is 26% of the exam's weighting stacked on a handful of definitions, and the questions that test it are short, direct, and completely winnable — which makes this some of the cheapest marks available anywhere on the CLF-C02.
