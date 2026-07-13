---
title: "AWS Cloud Practitioner (CLF-C02) Study Guide"
description: "Everything you need to pass AWS's entry-level certification: what CLF-C02 covers, the four domains in detail, the service pairs it loves to confuse, and a two-week plan."
examCode: "CLF-C02"
slug: "clf-c02"
updated: "2026-07-13"
faqs:
  - q: "Do I need any AWS experience to pass CLF-C02?"
    a: "No. Cloud Practitioner is designed to be passed without ever having logged into the AWS console. It tests breadth of vocabulary and the shared responsibility model, not hands-on skill. That said, an hour spent clicking around the free tier makes the service names stick far faster than reading about them."
  - q: "Is the Cloud Practitioner worth it if I want an engineering job?"
    a: "As a hiring signal on its own, not really — engineering managers look for the associate-level certs. Its value is as scaffolding: it clears the AWS vocabulary and pricing models cheaply, so when you start the Solutions Architect Associate you spend your time on design decisions instead of definitions."
---

The AWS Certified Cloud Practitioner is AWS's foundational certification. It validates a big-picture understanding of the AWS cloud — what the major services do, how pricing and support work, and who is responsible for what under the shared responsibility model. No hands-on experience is required, which makes it the standard first step for non-engineers and career changers alike.

It is a breadth exam, not a depth exam. That sounds easy and mostly is, but it should change how you study: you are building a wide, shallow map, and the exam tests whether you can tell two neighbouring services apart in one sentence.

## Who should take it

CLF-C02 is designed for people in sales, finance, project management, and leadership who work alongside cloud teams — and for aspiring engineers who want a structured on-ramp before tackling an associate-level exam. If you already work hands-on with AWS daily, you can usually skip straight to the [Solutions Architect Associate](/exams/saa-c03).

## How the exam is scored

You'll face 65 questions in 90 minutes, scored on a 100–1,000 scale with a passing mark of 700. Some questions are unscored pilot items, and you won't know which. The questions are shorter and more direct than associate-level exams — mostly "which service does X?" and "under the shared responsibility model, who handles Y?"

The time pressure is mild. Ninety minutes for 65 short questions is generous and most candidates finish with time to spare. Use it to revisit anything you flagged rather than leaving early.

## The four domains, one by one

### Cloud Technology and Services (33%)

The largest domain: the service catalogue. You need breadth, not depth — what each service is *for*, in one line.

Compute: EC2 (virtual machines you manage), Lambda (run code without managing servers), ECS and EKS (containers), Elastic Beanstalk (deploy an app and let AWS handle the plumbing). Storage: S3 (objects), EBS (a disk attached to one EC2 instance), EFS (a shared filesystem for many instances), Glacier (archive). Databases: RDS (managed relational), DynamoDB (managed NoSQL), Redshift (data warehouse), ElastiCache (in-memory cache). Networking: VPC (your private network), Route 53 (DNS), CloudFront (CDN), Direct Connect (a dedicated line from your datacentre).

That is genuinely most of the domain. The exam wants recognition, not architecture.

### Cloud Concepts (26%)

The benefits pitch and the global infrastructure. Know the advantages of cloud in AWS's own framing — trade capital expense for variable expense, benefit from massive economies of scale, stop guessing capacity, increase speed and agility, stop spending money running datacentres, and go global in minutes.

Know the geography precisely, because it is a reliable source of free marks. A **Region** is a geographic area. An **Availability Zone** is one or more discrete datacentres within a Region. An **edge location** is a CloudFront caching site, and there are far more of them than Regions. Any question describing "reducing latency for global users by caching content close to them" is edge locations and CloudFront, every time.

Also learn the six pillars of the Well-Architected Framework by name: operational excellence, security, reliability, performance efficiency, cost optimisation, and sustainability.

### Security and Compliance (25%)

Dominated by one idea. **AWS is responsible for security *of* the cloud** — the hardware, the facilities, the physical network, and patching the managed services. **You are responsible for security *in* the cloud** — your data, your IAM users and permissions, your security-group rules, your encryption choices, and patching the guest OS on an EC2 instance you launched.

The exam probes the boundary, so work through the edge cases until they are automatic. Who patches the operating system on an EC2 instance? You do. Who patches the operating system underlying RDS? AWS does. Who secures the datacentre? AWS. Who classifies your data? You.

Beyond that: IAM basics (users, groups, roles, policies; enable MFA on the root account and then stop using it), encryption in transit and at rest, and Artifact for downloading compliance reports.

### Billing, Pricing, and Support (16%)

The smallest domain and the most mechanical, which makes it the cheapest points on the exam.

The EC2 pricing models: **On-Demand** (pay as you go, no commitment, for spiky and unpredictable workloads), **Reserved Instances and Savings Plans** (commit for one or three years for a large discount, for steady baseline load), **Spot** (deeply discounted spare capacity that can be reclaimed at short notice, for fault-tolerant and interruptible work), and **Dedicated Hosts** (a physical server to yourself, usually for licensing reasons).

Then the support plans in ascending order — Basic, Developer, Business, Enterprise — and the fact the exam actually tests: if a question mentions a **Technical Account Manager**, the answer is the Enterprise tier. Business is the point at which you get 24/7 phone and chat access to a Cloud Support Engineer.

## The service pairs the exam loves to confuse

Almost every free mark on this exam is one of these. Drill them until the distinction is instant.

| Confused pair | The difference in one line |
| --- | --- |
| CloudWatch vs CloudTrail | CloudWatch = metrics, logs, alarms (what is it *doing*). CloudTrail = API audit log (who *did* what). |
| Region vs Availability Zone | A Region is a geographic area; an AZ is a datacentre cluster inside it. Multi-AZ is not multi-Region. |
| Global vs regional services | IAM, Route 53, and CloudFront are global. Almost everything else is regional. |
| EBS vs EFS vs S3 | One disk for one instance (EBS), one filesystem shared by many (EFS), objects over HTTP (S3). |
| Trusted Advisor vs Well-Architected Tool | Trusted Advisor runs automated checks against your live account; the Well-Architected Tool is a structured self-review questionnaire. |
| Cost Explorer vs Budgets | Explorer analyses spend that already happened; Budgets alerts you *before* you overspend. |
| Shield vs WAF | Shield = DDoS protection. WAF = filters malicious HTTP requests such as SQL injection and XSS. |
| Pricing Calculator vs Cost Explorer | Estimating a workload you haven't built yet vs analysing one you're already paying for. |

## A realistic two-week plan

**Week one — build the map.** Days 1–2 on cloud concepts and the global infrastructure. Days 3–5 on the service catalogue, one category at a time (compute, storage, database, networking), writing a one-line purpose for each service as you go. Do not go deep. If you find yourself reading about DynamoDB partition keys, you have overshot the exam by a mile.

**Week two — drill and close gaps.** Practice questions daily, reviewing every wrong answer properly: the point of a wrong answer is to find the *category* of thing you don't know, not to memorise that one item. Give the shared responsibility model its own session and pricing and support another. Re-read the confused-pairs table on the morning of the exam.

Most candidates need 15–25 hours in total. If you are already technical, closer to 10.

## Common pitfalls

The classic mistakes are mixing up CloudWatch with CloudTrail, confusing Regions with Availability Zones, and not knowing which services are global versus regional.

The other failure mode is over-preparation. Candidates from an engineering background often study CLF-C02 as though it were the Solutions Architect exam, burn a month on it, and then find the real thing asking them to identify what Amazon S3 is. Trust the level: breadth, one line per service, move on.

## After you pass

Check the [official AWS Cloud Practitioner page](https://aws.amazon.com/certification/certified-cloud-practitioner/) for current pricing, scheduling, and the exam guide PDF. The certificate is valid for three years, and passing any associate-level exam automatically renews it.

Most engineers continue to the [Solutions Architect Associate](/exams/saa-c03). The jump in difficulty is real — SAA-C03 asks you to *choose* between services under a constraint rather than just name them — but it is very manageable on the foundation CLF-C02 gives you.
