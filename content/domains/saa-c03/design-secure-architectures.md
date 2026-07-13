---
description: "Design Secure Architectures is 24% of the SAA-C03 — IAM, KMS, and one principle that answers most of the questions. What it tests, the traps, and how to study it."
---

## What this domain actually tests

IAM, mostly — and it is far less about policy syntax than about a single principle you can apply almost mechanically:

**Roles, not keys.**

If an answer option involves storing access keys on an EC2 instance, embedding credentials in application code, hardcoding them in a config file, or emailing them to a partner company, **it is wrong**. It does not matter how plausible the rest of the sentence sounds. The correct answer is an IAM role — an instance profile for EC2, an execution role for Lambda, a cross-account role for the partner.

That one rule resolves a genuinely large share of this domain, and it costs you nothing to apply.

Beyond it, the domain covers encryption (KMS, and the difference between the SSE options), secrets handling, multi-account governance with Organizations and SCPs, and the edge protections — WAF, Shield, CloudFront.

## The traps

**Secrets Manager versus Parameter Store.** The deciding question is one word: **rotation**. If the requirement mentions automatically rotating a database credential, it is Secrets Manager. If it is just configuration or a value you set once, Parameter Store is cheaper and is the intended answer. Questions offer both.

**SSE-S3 versus SSE-KMS.** Both encrypt at rest. KMS is the answer when the requirement mentions an **audit trail of key usage**, **control over key rotation**, or **a customer-managed key**. If the requirement is simply "encrypt the data," SSE-S3 suffices and is cheaper.

**SCPs never grant anything.** A Service Control Policy only restricts what accounts in an organisation are *permitted* to do. An identity still needs an IAM policy granting the action. Options that describe an SCP "giving" a team access are wrong by construction, and this is tested more often than its weighting suggests.

**Security groups cannot deny.** If a requirement is to block one specific malicious IP address, a security group cannot do it — only a NACL has explicit deny rules.

## How to study it

Read IAM policy JSON until you can scan `Effect`, `Action`, `Resource`, and `Condition` and say what it permits in a few seconds. Then learn the one rule that settles conflicts: **an explicit Deny always wins**, no matter how many Allows exist elsewhere.

In your practice, get in the habit of scanning the options for a credentials-on-disk answer *first* and eliminating it immediately. It is usually there, it is usually attractive, and removing it turns a four-option question into a three-option one before you have done any real thinking.

Then drill the pairs: Secrets Manager vs Parameter Store, SSE-S3 vs SSE-KMS, SCP vs IAM policy, security group vs NACL. This domain is 24% of the exam and it is one of the most mechanical to prepare for — which makes it some of the best-value study time you can spend.
