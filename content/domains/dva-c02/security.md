---
description: "Security is 26% of the DVA-C02 — reading IAM policy JSON, KMS envelope encryption, and the secrets decision. What it tests, the traps, and how to study it."
---

## What this domain actually tests

Three things, and all three are learnable to a high standard in a week.

**Reading IAM policy JSON fluently.** This is a genuine exam skill, not a metaphor. Questions show you a policy and ask what it permits. You need to scan `Effect`, `Action`, `Resource`, and `Condition` and produce an answer in seconds, because the clock does not care that you can *eventually* work it out.

The rule that settles every conflict: **an explicit `Deny` always wins**, regardless of how many `Allow` statements exist anywhere else, in any policy.

**Roles, never keys.** If an option embeds credentials in code, in an environment variable, or in a config file, it is wrong. Lambda gets an execution role. EC2 gets an instance profile. Cross-account access uses STS `AssumeRole`. Scan for the credentials-on-disk option and eliminate it before you think about anything else.

**Encryption and secrets**, which is where the domain's most distinctive question lives.

## The traps

**KMS envelope encryption, and why it exists.** KMS will only *directly* encrypt payloads up to **4 KB**. That single limit is the tell: any question about encrypting a large object with KMS is an envelope-encryption question.

The pattern: call **`GenerateDataKey`**, receive a plaintext data key *and* an encrypted copy of it, encrypt your large data locally with the plaintext key, discard the plaintext key from memory, and store the encrypted key alongside the ciphertext. To decrypt, you ask KMS to decrypt the data key first.

If you remember one thing from this domain, make it `GenerateDataKey` and the 4 KB limit.

**Secrets Manager versus Parameter Store.** One word decides it: **rotation**. Does the requirement mention automatically rotating a database credential? Secrets Manager. Otherwise Parameter Store, which is cheaper and is what the question wants. Both will be offered.

**API Gateway authorisers.** IAM (for AWS-signed callers), Cognito user pools (for end users you authenticate), or a Lambda authoriser (for custom logic, third-party tokens, or anything unusual). The exam names an auth scenario and expects the right one.

## How to study it

Print out a handful of real IAM policies and practise reading them under a timer. Cover the answer, scan the JSON, state what it allows, then check. Twenty of these and the skill is yours permanently.

Then draw the envelope-encryption flow on paper until you can reproduce it from memory — the two keys, which one gets thrown away, and what gets stored. It is the kind of thing that seems obvious while reading and evaporates under exam pressure.

Finally, get in the reflex of scanning the answer options for hardcoded credentials and striking that option out immediately. It appears more often than you would expect, it is always wrong, and eliminating it for free turns a four-option question into a three-option one.
