---
description: "Development with AWS Services is 32% of the DVA-C02 — mostly Lambda and DynamoDB, including the capacity maths and the invocation-error split. What it tests and how to study it."
---

## What this domain actually tests

The biggest domain on the exam, and in practice it is **Lambda and DynamoDB** with some messaging around the edges.

The most reliably tested thing in the entire domain is **how Lambda handles errors, which depends entirely on how it was invoked**. Candidates blur these three and lose marks they did not need to:

- **Synchronous** (API Gateway, ALB, direct invoke) — the error goes straight back to the caller. **No automatic retry.**
- **Asynchronous** (S3, SNS, EventBridge) — Lambda retries **twice** on its own, then sends the event to a dead-letter queue or on-failure destination if you configured one.
- **Stream-based** (Kinesis, DynamoDB Streams) — retries **until the record succeeds or expires**, and a failing record **blocks the shard**.

That last one produces a signature question: processing has stopped and messages are backing up. A single poison-pill record is stalling the whole partition. The fixes are bisect-on-error, a maximum retry count, and a failure destination.

For DynamoDB, the domain is unusually **calculable**, which makes it winnable.

## The traps

**The capacity maths.** Learn these until they are arithmetic:

- **1 RCU** = one *strongly consistent* read of up to **4 KB**/sec, or **two** eventually consistent reads.
- **1 WCU** = one write of up to **1 KB**/sec.
- **Always round item size up** to the block boundary.

*100 strongly consistent reads/sec of 6 KB items?* 6 KB rounds to two 4 KB blocks → 2 RCUs each → **200 RCUs**. Eventually consistent halves it → **100**.

**GSI versus LSI.** A GSI has a *different* partition key, is eventually consistent, has its own capacity, and can be added **later**. An LSI shares the partition key, must be created **with the table**, and can never be added afterwards. That "can't add an LSI later" fact is a favourite.

**Hot partitions.** A scenario using a date or a status flag as the partition key is describing a hot partition. Good keys are high-cardinality and evenly distributed.

**Cognito user pools versus identity pools.** A **user pool** authenticates people — it is the identity provider. An **identity pool** hands out temporary AWS credentials so an authenticated user can call AWS services directly. The exam conflates them on purpose.

## How to study it

Build a small API Gateway → Lambda → DynamoDB application. Not a tutorial you follow — one you debug. You will hit the execution role you forgot to grant, the malformed response that returns a 502, and the throttling when you under-provisioned the table. Those are the exact things the exam asks about.

Then drill the RCU/WCU calculations until each takes twenty seconds, and make yourself state the invocation-error behaviour out loud for all three types. This domain is nearly a third of the exam and it rewards depth in two services rather than breadth across sixty.
