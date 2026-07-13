---
title: "The Services You Must Know Cold for the AWS Developer Associate (DVA-C02)"
description: "DVA-C02 rewards depth over breadth. These are the six service areas that carry the exam, with the exact details the questions probe."
slug: "aws-developer-associate-services-to-know"
examCode: "DVA-C02"
date: "2026-07-06"
---

The [Developer Associate](/exams/dva-c02) has a different shape from other AWS exams: instead of testing a broad catalogue, it hammers a small set of services at real depth. If you allocate your study time evenly across all of AWS, you'll be over-prepared for questions that never come and under-prepared for the ones that decide your score. Here's where the marks actually live.

## 1. Lambda — the centre of gravity

Expect Lambda in a large share of your questions, directly or as part of a scenario. The details that get tested:

- **Invocation models and their error handling.** Synchronous (API Gateway) errors return to the caller; asynchronous (S3, SNS) retries twice then goes to a DLQ or failure destination; stream-based (Kinesis, DynamoDB Streams) blocks the shard and retries until it succeeds or expires. Questions describe a failure symptom and ask why — this table is the answer.
- **Versions, aliases, and traffic shifting** — how canary deployments work via alias weights.
- **Performance levers**: memory (which also scales CPU), reserved vs provisioned concurrency, and what actually reduces cold starts.

## 2. DynamoDB — where the math lives

DynamoDB questions are the most calculable on the exam. Learn the capacity formulas until they're arithmetic: one RCU is one strongly consistent read of up to 4 KB per second (two eventually consistent), one WCU is one write of up to 1 KB. The exam gives you item sizes and throughput targets and expects a number.

Beyond the math: GSI vs LSI (creation time, key flexibility, consistency), when a hot partition happens and how key design prevents it, conditional writes for idempotency, and DAX as the answer to "microsecond reads with minimal code change".

## 3. API Gateway — the front door

Know REST vs HTTP APIs (features vs cost/simplicity), Lambda proxy vs non-proxy integration, and the authoriser options: IAM, Cognito user pools, and Lambda authorisers — the exam loves asking which fits a given auth scenario. Stages, stage variables, and usage plans with API keys round out the recurring cast.

## 4. IAM, KMS, and secrets

You must read IAM policy JSON fluently — questions show a policy and ask what it allows. Know roles vs users (and why EC2/Lambda should always use roles), STS `AssumeRole`, and cross-account patterns. For KMS: envelope encryption (`GenerateDataKey` for large data, `Encrypt` only under 4 KB) and the difference between Secrets Manager (rotation built in, costs money) and Parameter Store (free tier, no native rotation).

## 5. The CI/CD suite

CodePipeline orchestrates, CodeBuild builds (know `buildspec.yml` structure), CodeDeploy deploys. The exam's favourite corner: deployment configurations — in-place vs blue/green for EC2, and canary vs linear vs all-at-once for Lambda and ECS, including what `Canary10Percent5Minutes` means operationally.

## 6. Observability: X-Ray and CloudWatch

X-Ray answers every "trace a request across services" question — know the daemon, segments, subsegments, and annotations (indexed, filterable) vs metadata (not). CloudWatch questions probe custom metrics, embedded metric format, metric filters on logs, and alarms.

## How to turn this list into a pass

Build one small serverless app that touches all six areas — API Gateway + Lambda + DynamoDB, deployed by CodePipeline, traced with X-Ray, secrets in Parameter Store. Then drill fresh practice questions and keep an error log by service. When your misses in a service area drop to near zero on questions you've never seen, it's cold — move to the next one.
