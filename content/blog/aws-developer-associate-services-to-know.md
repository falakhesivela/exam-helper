---
title: "The Services You Must Know Cold for the AWS Developer Associate (DVA-C02)"
description: "DVA-C02 rewards depth over breadth. These are the six service areas that carry the exam, with worked capacity maths and the exact details the questions probe."
slug: "aws-developer-associate-services-to-know"
examCode: "DVA-C02"
date: "2026-07-06"
updated: "2026-07-13"
---

The [Developer Associate](/exams/dva-c02) has a different shape from other AWS exams. Instead of testing a broad catalogue, it hammers a small set of services at real depth. If you allocate your study time evenly across all of AWS, you will be over-prepared for questions that never come and under-prepared for the ones that decide your score.

Here is where the marks actually live.

## 1. Lambda — the centre of gravity

Expect Lambda in a large share of your questions, directly or as part of a scenario.

**Invocation models and their error handling** is the most reliably tested thing on this exam, and it is a three-way split people consistently blur:

| Invocation | Triggered by | What happens on error |
|---|---|---|
| **Synchronous** | API Gateway, ALB, direct invoke | Error returns to the caller. **No automatic retry.** |
| **Asynchronous** | S3, SNS, EventBridge | Lambda retries **twice**, then sends the event to a DLQ or on-failure destination |
| **Stream-based** | Kinesis, DynamoDB Streams | Retries **until success or the record expires** — and a failing record **blocks the shard** |

That last row is the one that catches people. A single poison-pill record will stall the entire partition until it ages out. Questions describe exactly this symptom — "processing has stopped and messages are backing up" — and the fixes are bisect-on-error, a maximum retry count, and a failure destination.

Also know **versions, aliases, and traffic shifting** (an alias is a movable pointer; weighted aliases are how canary deployments actually work; `$LATEST` is mutable and should never be what production points at), and the **performance levers**: memory — which also scales CPU, so raising it can make a function faster *and* cheaper — plus **provisioned concurrency** (eliminates cold starts) versus **reserved concurrency** (caps a function so it cannot starve the rest of your account). Two very different things with confusingly similar names, and the exam knows it.

## 2. DynamoDB — where the maths lives

DynamoDB questions are the most calculable on the exam, which makes them the most reliably winnable. Learn the formulas until they are arithmetic:

- **1 RCU** = one **strongly consistent** read of up to **4 KB** per second, or **two eventually consistent** reads.
- **1 WCU** = one write of up to **1 KB** per second.
- **Always round item size up** to the block boundary.

### Worked examples

**100 strongly consistent reads per second of 6 KB items.**
6 KB rounds up to 2 blocks of 4 KB → 2 RCUs per read → 100 × 2 = **200 RCUs.**

**The same, but eventually consistent.**
Eventually consistent halves it → **100 RCUs.**

**50 writes per second of 3.5 KB items.**
3.5 KB rounds up to 4 blocks of 1 KB → 4 WCUs per write → 50 × 4 = **200 WCUs.**

The exam gives you item sizes and throughput targets and expects a number. Do these until they take twenty seconds.

Beyond the maths: **GSI vs LSI** (a GSI has a different partition key, is eventually consistent, has its own capacity, and can be added later; an LSI shares the partition key, must be created *with* the table, and cannot be added afterwards), **hot partitions** and how key design prevents them (a scenario using a date as the partition key is describing a hot partition), **conditional writes** for idempotency and optimistic locking, and **DAX** as the answer to "microsecond reads with minimal application change."

## 3. API Gateway — the front door

Know **REST vs HTTP APIs** (features versus cost and simplicity), **Lambda proxy vs non-proxy** integration, and the authoriser options: IAM, Cognito user pools, and Lambda authorisers. The exam loves asking which fits a given auth scenario.

While you are here, learn the error codes, because troubleshooting questions lean on them:

- **502** — your Lambda returned a malformed response. It must have `statusCode` and `body`.
- **504** — the integration timed out.
- **429** — throttling; you have hit a usage plan or account limit.

Stages, stage variables, and usage plans with API keys round out the recurring cast.

## 4. IAM, KMS, and secrets

**You must read IAM policy JSON fluently.** Questions show a policy and ask what it allows. Practise scanning `Effect`, `Action`, `Resource`, and `Condition` and stating the answer in seconds. The rule that resolves ties: **an explicit Deny always wins**, regardless of any Allow anywhere else.

**Roles, never keys.** If an option embeds credentials in code, in an environment variable, or in a config file, it is wrong. Lambda gets an execution role, EC2 gets an instance profile, cross-account access uses STS `AssumeRole`.

**KMS envelope encryption** appears reliably, and the reason it exists is the tell: KMS will only directly encrypt payloads up to **4 KB**. So any question about encrypting a large object with KMS is an envelope-encryption question. The pattern: call `GenerateDataKey`, receive a plaintext data key *and* an encrypted copy of it, encrypt your data locally with the plaintext key, discard the plaintext key, and store the encrypted key alongside the ciphertext.

**Secrets Manager vs Parameter Store:** does it need automatic rotation? Secrets Manager. Otherwise Parameter Store, which is cheaper.

## 5. The CI/CD suite

CodePipeline orchestrates, CodeBuild builds (know the `buildspec.yml` structure and its phases), CodeDeploy deploys.

The exam's favourite corner is **deployment configurations**: in-place versus blue/green for EC2, and canary versus linear versus all-at-once for Lambda and ECS. Know what a name like `Canary10Percent5Minutes` means operationally — shift 10% of traffic, wait five minutes, then shift the remaining 90%. Questions describe a risk appetite ("we want to catch errors on a small subset of users before full rollout") and expect the matching strategy.

Pair that with automatic rollback on a CloudWatch alarm, which is the standard answer to "roll back automatically when the error rate spikes."

## 6. Observability: X-Ray and CloudWatch

**X-Ray** answers every "trace a request across services" question. Know the daemon, segments and subsegments, and the distinction the exam actually tests: **annotations are indexed and filterable; metadata is not.** If a question wants to *search* traces by a value, that value must be an annotation.

CloudWatch questions probe custom metrics, the embedded metric format, metric filters that turn a log pattern into an alarmable metric, and alarms themselves.

## How to turn this list into a pass

**Build one small serverless app that touches all six areas.** API Gateway → Lambda → DynamoDB, deployed by CodePipeline, traced with X-Ray, secrets in Parameter Store.

A single weekend project like this covers a remarkable share of the question pool, because the exam asks about exactly the decisions and failures you will hit along the way: the execution role you forgot to grant, the 502 from a malformed response, the throttling when you under-provisioned the table, the cold start you did not expect.

Then drill fresh practice questions and **keep an error log by service area.** When your misses in a service area drop to near zero on questions you have never seen before, it is cold. Move to the next one.

That per-service error log is the whole trick. It turns "I should study more" into a specific, finishable list — and on an exam that rewards depth in six places rather than breadth in sixty, a finishable list is exactly what you need.
