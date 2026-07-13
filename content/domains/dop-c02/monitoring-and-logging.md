---
description: "Monitoring and Logging is 15% of the DOP-C02 — composite alarms, cross-account log aggregation with subscription filters, and metric filters."
---

## What this domain actually tests

Observability across many accounts, which is a genuinely different problem from observability in one.

The canonical pattern you must know — and it appears reliably — is **centralised, cross-account logging**: CloudWatch Logs **subscription filters** stream log events to **Kinesis Data Firehose**, which delivers them to a central S3 bucket or analytics destination. If a question describes aggregating logs from dozens of accounts into one place, that is the shape of the answer, and a solution involving someone copying log files on a schedule is not.

Then the alarm machinery: standard CloudWatch alarms, **composite alarms** (combine several alarms with boolean logic to cut noise — the answer to "we're getting too many alerts"), and **anomaly detection** (alarm on deviation from a learned baseline rather than a fixed threshold, which is the answer when a static threshold cannot work because traffic varies).

## The traps

**Metric filters turn logs into metrics.** If you need to alarm on a *pattern in a log file* — say, a spike in `ERROR` lines — you cannot alarm on the log directly. You create a **metric filter** that extracts a metric from the log, then alarm on the metric. Questions describe wanting to be alerted about something appearing in logs, and this two-step is the answer.

**Composite alarms are the noise answer.** When the scenario complains about alert fatigue or too many pages, look for composite alarms rather than for raising thresholds.

**Anomaly detection is the variable-baseline answer.** When the scenario says traffic varies by time of day or season and static thresholds produce false alarms, that is anomaly detection by name.

**Synthetics canaries are proactive.** They test an endpoint on a schedule *before* a user complains. If the requirement is to detect an outage before customers report it, canaries — not log analysis, which is inherently reactive.

**X-Ray and ServiceLens** for distributed tracing across services. Remember from the developer material: **annotations are indexed and searchable; metadata is not.**

## How to study it

Set up a subscription filter that ships a log group to Firehose. It is a fiddly, unglamorous exercise and it is exactly the sort of thing the exam assumes you have done — the permissions alone will teach you something.

Then create a metric filter on a log group, alarm on the resulting metric, and trigger it. Then wrap two alarms in a composite alarm and see how the logic works.

The through-line for the whole domain, and the tie-breaker to apply when options look equivalent: **the solution that reacts to an event automatically beats the one that requires a person to look at a dashboard.** Dashboards are for humans; the exam is testing whether you can build a system that does not need one.
