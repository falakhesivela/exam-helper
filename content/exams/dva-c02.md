---
title: "AWS Developer Associate (DVA-C02) Study Guide"
description: "How to prepare for the AWS Developer Associate exam: the four domains, the services that dominate the question pool, the DynamoDB and Lambda details it tests, and a build-first strategy."
examCode: "DVA-C02"
slug: "dva-c02"
updated: "2026-07-13"
faqs:
  - q: "Should I take the Solutions Architect Associate or the Developer Associate first?"
    a: "Take the one that matches your day job. They overlap by roughly a third, so the second is always easier than the first. If you write application code that runs on AWS, start with DVA-C02. If you design infrastructure, start with SAA-C03. There is no required order."
  - q: "Do I need to write code in the DVA-C02 exam?"
    a: "You never write code from scratch, but you do read it. Expect to interpret IAM policy JSON, spot the flaw in a snippet of SDK usage, and recognise a correct CLI or SAM template shape. Reading fluency matters; typing does not."
---

The AWS Certified Developer – Associate validates that you can build, deploy, and debug applications on AWS. Where the Solutions Architect exam thinks in diagrams, DVA-C02 thinks in code: SDK calls, IAM policies, Lambda configurations, and the error messages you meet when something breaks.

That difference matters for how you prepare. SAA-C03 rewards knowing which service to choose. DVA-C02 rewards knowing what happens when the one you chose misbehaves at 3am.

## Who should take it

This exam suits working developers who ship to AWS, and anyone whose day job involves Lambda, API Gateway, DynamoDB, or CI/CD pipelines. AWS suggests a year or more of hands-on development experience. If your background is infrastructure rather than code, the [Solutions Architect Associate](/exams/saa-c03) is usually the better fit — the two exams overlap about 30%, so many people take both.

## How the exam is scored

65 questions in 130 minutes, scored 100–1,000 with a 720 pass mark. As with all AWS associate exams, 15 questions are unscored pilots you cannot identify. There is no penalty for guessing, so never leave anything blank.

## The four domains, one by one

### Development with AWS Services (32%)

The biggest domain, and it is mostly Lambda and DynamoDB.

**Lambda**: memory and timeout settings (and the fact that CPU scales *with* memory, so raising memory can make a function both faster and cheaper), environment variables, layers, versions and aliases, and event source mappings. Understand the three invocation types and — critically — how errors behave in each:

- **Synchronous** (API Gateway, ALB): the error goes straight back to the caller. No automatic retry.
- **Asynchronous** (S3, SNS, EventBridge): Lambda retries **twice** automatically, then sends the event to a dead-letter queue or on-failure destination if you configured one.
- **Stream-based** (Kinesis, DynamoDB Streams): retries **until the record expires or succeeds**, and — the part that catches people — a failing record **blocks the shard**. A poison-pill record will stall the whole partition until it ages out. The fixes are a bisect-on-error setting, a maximum retry count, and a failure destination.

That three-way split is one of the most reliably tested things on this exam.

**DynamoDB**: partition key design (high cardinality, evenly distributed — the exam loves a scenario where a bad key creates a hot partition), the difference between a **GSI** (different partition and sort key, eventually consistent, own capacity) and an **LSI** (same partition key, different sort key, must be created with the table), conditional writes for optimistic locking, and Streams.

Learn the capacity maths cold, because it is free marks:

- **1 RCU** = one strongly consistent read of up to 4 KB per second, or **two** eventually consistent reads.
- **1 WCU** = one write of up to 1 KB per second.

Round item sizes **up** to the block boundary. A 6 KB item needs 2 RCUs strongly consistent, 1 RCU eventually consistent. A 1.5 KB write needs 2 WCUs.

Then: S3 operations and event notifications, SQS versus SNS versus EventBridge, and Cognito — **user pools** authenticate people (they are the identity provider) while **identity pools** hand out temporary AWS credentials so an authenticated user can call AWS services directly. Questions conflate the two on purpose.

### Security (26%)

Reading IAM policy JSON quickly is a genuine exam skill — practise until you can scan `Effect`, `Action`, `Resource`, and `Condition` and say what a policy permits in a few seconds. Remember that an **explicit Deny always wins**, regardless of any Allow.

**Roles, never keys.** If an option embeds credentials in code, in an environment variable, or in a config file, it is wrong. Lambda gets an execution role; EC2 gets an instance profile; a user assuming cross-account access gets STS `AssumeRole`.

**KMS envelope encryption** appears reliably. The pattern: call `GenerateDataKey`, get back a plaintext data key and an encrypted copy of it, encrypt your (large) data locally with the plaintext key, throw the plaintext key away, and store the encrypted key alongside the ciphertext. The reason it exists is that KMS will only directly encrypt payloads up to 4 KB — so any question about encrypting a large object with KMS is an envelope-encryption question.

**Secrets Manager versus Parameter Store**: does it need automatic rotation? Secrets Manager. Otherwise Parameter Store, which is cheaper.

### Deployment (24%)

CI/CD: CodePipeline (orchestration), CodeBuild (build and test), CodeDeploy (release).

Know the **CodeDeploy deployment strategies** and, for Lambda and ECS, the traffic-shifting patterns: **canary** (shift a small percentage, wait, then shift the rest), **linear** (shift an equal increment every N minutes), and **all-at-once**. Questions describe a risk tolerance and expect you to name the pattern.

**Lambda versions and aliases** underpin all of it: an alias is a movable pointer to a version, and weighted aliases are how traffic shifting actually works. `$LATEST` is mutable and should never be what production points at.

Then CloudFormation and SAM basics — know that SAM is a shorthand transform that expands into CloudFormation, and recognise the common resource types.

### Troubleshooting and Optimization (18%)

**X-Ray** for distributed tracing: know that it needs the daemon (or the managed integration), that you annotate segments with metadata and annotations, and that **annotations are indexed and searchable while metadata is not** — a small distinction the exam likes.

CloudWatch Logs and metrics, custom metrics, and the embedded metric format. Debugging API Gateway errors: a **502** usually means your Lambda returned a malformed response (wrong shape — it must have `statusCode` and `body`), a **504** means it timed out, and a **429** means throttling.

Lambda performance: cold starts, provisioned concurrency to eliminate them, and reserved concurrency to *cap* a function so it cannot starve the rest of your account. Those two are different things with confusingly similar names, and the exam knows it.

## How to prepare

**Build something small but real.** An API Gateway → Lambda → DynamoDB application, deployed with SAM or CDK through a CodePipeline. A single weekend project like this covers a remarkable share of the question pool, because the exam asks about exactly the decisions and failures you will hit along the way: the IAM role you forgot to give the function, the 502 from a malformed response, the throttling when you under-provisioned the table.

Then drill practice questions until you can explain *why* each wrong option is wrong. On this exam the distractors are usually plausible-but-subtly-broken code or configuration, and the skill being measured is spotting the flaw.

## Common pitfalls

Candidates lose the most marks on DynamoDB capacity calculations — learn the RCU/WCU formulas until they are automatic. Close behind: confusing Lambda's synchronous, asynchronous, and stream-based error handling, and not knowing what envelope encryption is or when `GenerateDataKey` is the answer.

Deployment-strategy questions about CodeDeploy traffic shifting are frequent and very learnable, so it is a shame to drop them. Same for the user-pool versus identity-pool distinction in Cognito.

## After you pass

Check the [official AWS Developer Associate page](https://aws.amazon.com/certification/certified-developer-associate/) for current pricing and the exam guide PDF.

DVA-C02 renews any Cloud Practitioner certificate you hold and sets you up for the [DevOps Engineer Professional](/exams/dop-c02), which extends the same material into automation at scale — and is a substantially harder exam.
