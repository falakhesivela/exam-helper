---
description: "Troubleshooting and Optimization is 18% of the DVA-C02 — X-Ray, the API Gateway error codes, and the two Lambda concurrency settings people mix up."
---

## What this domain actually tests

Debugging, tracing, and performance tuning — the smallest domain on the exam and the most practical. If you have ever operated a serverless application at 3am, most of this is already yours.

**X-Ray** answers every "trace a request across multiple services" question. You need the daemon (or the managed integration), segments and subsegments, and one distinction the exam tests specifically:

> **Annotations are indexed and searchable. Metadata is not.**

If a question wants to *filter or search* traces by some value, that value must be an **annotation**. Metadata is along for the ride but cannot be queried. It is a small fact and it is worth a mark.

**CloudWatch** covers custom metrics, the embedded metric format, **metric filters** (which turn a log pattern into a metric you can alarm on), and alarms themselves.

## The traps

**The API Gateway error codes.** Learn these three; they turn vague troubleshooting questions into instant answers:

- **502 Bad Gateway** — your Lambda returned a **malformed response**. The response must contain `statusCode` and `body`. This is the most common one and it is almost always a code bug, not a config one.
- **504 Gateway Timeout** — the integration **timed out**.
- **429 Too Many Requests** — **throttling**, from a usage plan or an account concurrency limit.

**Reserved versus provisioned concurrency.** Two settings with confusingly similar names doing genuinely opposite things, and the exam knows it:

- **Provisioned concurrency** keeps execution environments warm. It **eliminates cold starts**. Use it when latency matters.
- **Reserved concurrency** *caps* how much concurrency a function may consume, so it **cannot starve the rest of your account** — and, as a side effect, it throttles that function.

If a question is about latency and cold starts, it is provisioned. If it is about one function consuming all available concurrency and breaking everything else, it is reserved.

**Memory is the performance lever, and it also controls CPU.** Raising a Lambda's memory raises its CPU allocation proportionally, so a compute-bound function can become *faster and cheaper* at higher memory, because it finishes sooner. This is counter-intuitive and therefore reliably tested.

**DynamoDB throttling** points at either under-provisioned capacity or a hot partition. Read the key design in the stem before assuming it is a capacity problem.

## How to study it

Break things on purpose. Return a raw string from a Lambda behind API Gateway and watch the 502. Set a one-second timeout on something slow and watch the 504. Hammer an endpoint until you get a 429.

Ten minutes of deliberately causing each error teaches you more than any amount of reading, because on exam day the question gives you the *symptom* and expects you to name the cause — and you will simply recognise it.

Then write down the reserved-versus-provisioned distinction in your own words. If you cannot explain which one prevents cold starts without hesitating, you do not have it yet.
