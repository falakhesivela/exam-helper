---
title: "AWS Developer Associate (DVA-C02) Study Guide"
description: "How to prepare for the AWS Developer Associate exam: the services that dominate the question pool, scoring details, and a build-first study strategy."
examCode: "DVA-C02"
slug: "dva-c02"
updated: "2026-07-13"
---

The AWS Certified Developer – Associate validates that you can build, deploy, and debug applications on AWS. Where the Solutions Architect exam thinks in diagrams, DVA-C02 thinks in code: SDK calls, IAM policies, Lambda configurations, and the error messages you meet when something breaks.

## Who should take it

This exam suits working developers who ship to AWS, and anyone whose day job involves Lambda, API Gateway, DynamoDB, or CI/CD pipelines. AWS suggests a year or more of hands-on development experience. If your background is infrastructure rather than code, the [Solutions Architect Associate](/exams/saa-c03) is usually the better fit — the two exams overlap about 30%, so many people take both.

## How the exam is scored

65 questions in 130 minutes, scored 100–1,000 with a 720 pass mark. As with all AWS associate exams, 15 questions are unscored pilots you can't identify.

## The services that dominate

A handful of services carry most of the exam. Know these deeply rather than everything shallowly:

- **Lambda** — memory/timeout/concurrency settings, environment variables, layers, versions and aliases, event source mappings, and cold-start behaviour.
- **DynamoDB** — partition key design, GSIs vs LSIs, read/write capacity math, DAX, conditional writes, and streams.
- **API Gateway** — REST vs HTTP APIs, stages, usage plans, authorisers, and integration types.
- **IAM & security** — reading policy JSON quickly, roles vs users, STS, KMS envelope encryption, and Secrets Manager vs Parameter Store.
- **CI/CD** — CodePipeline, CodeBuild, CodeDeploy deployment strategies (in-place vs blue/green, canary vs linear for Lambda).
- **Observability** — X-Ray tracing, CloudWatch Logs and metrics, and embedded metric format.

## How to prepare

Build something small but real: an API Gateway + Lambda + DynamoDB app, deployed with SAM or CDK through a CodePipeline. A single weekend project like this covers a remarkable share of the question pool, because the exam asks about exactly the decisions and failures you'll hit along the way. Then drill practice questions until you can explain *why* every wrong option is wrong.

## Common pitfalls

Candidates lose the most marks on DynamoDB capacity calculations (learn the RCU/WCU formulas cold), on distinguishing Lambda's synchronous vs asynchronous vs stream-based invocation error handling, and on KMS questions — know what envelope encryption is and when to use `GenerateDataKey`. Deployment-strategy questions about CodeDeploy traffic shifting are also frequent and very learnable.

## After you pass

DVA-C02 renews any Cloud Practitioner certificate you hold and sets you up for the [DevOps Engineer Professional](/exams/dop-c02), which extends the same material into automation at scale.
