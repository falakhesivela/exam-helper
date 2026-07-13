---
description: "Deploying and Implementing a Cloud Solution is 28% of the GCP ACE — joint-largest domain. The compute decision tree, GKE, and gcloud command fluency."
---

## What this domain actually tests

The joint-largest domain, and the most **command-heavy** part of the exam. This is where the ACE differs most from AWS certifications: you will be shown four `gcloud` invocations and asked which one accomplishes a task.

The recurring conceptual question is **which compute service**, and Google's decision tree is cleaner than AWS's:

| If the workload is… | Use |
|---|---|
| A VM, or needs a specific OS, kernel, or licence | **Compute Engine** |
| A container: stateless, HTTP-driven, scale-to-zero | **Cloud Run** |
| Containers needing orchestration, sidecars, complex networking | **GKE** |
| A small function reacting to a single event | **Cloud Functions** |
| A web app you want fully managed with minimal config | **App Engine** |

**Cloud Run is the default answer more often than people expect.** Engineers arriving from AWS reach for Cloud Functions because it feels like Lambda, but if the workload is a container serving HTTP, Cloud Run is what Google wants.

## The traps

**GKE is far more central here than EKS is on AWS exams.** Cluster creation, node pools, autoscaling, and workloads. And the step everybody forgets: **`gcloud container clusters get-credentials`** before you can run `kubectl` at all.

**`kubectl` is not `gcloud`.** If the question is about pods, deployments, or services — anything *inside* a cluster — it is `kubectl`. If it is about the cluster itself, it is `gcloud`. Options mix the two deliberately.

**Preemptible / Spot VMs** are cheap and can be reclaimed. They are the answer for fault-tolerant batch work and the wrong answer for anything that must stay up.

**Command grammar is consistent, so learn the shape rather than the flags:**

`gcloud <group> <subgroup> <verb>`

- `gcloud compute instances create | list | describe | delete`
- `gcloud container clusters create | get-credentials`
- `gcloud run deploy`
- `gcloud storage` (the modern replacement for `gsutil`)

Once you internalise the grammar, wrong options start to look obviously malformed — which is much faster than reasoning about each one.

## How to study it

**Spend evenings in Cloud Shell doing real tasks.** Create an instance. Deploy a container to Cloud Run. Create a GKE cluster, get credentials, and run `kubectl get pods`. Switch projects with `gcloud config set project`.

There is no substitute here. You cannot memorise your way to command fluency from a list of flags, and you do not need to — a few hours of actually typing them makes the command questions *free marks*, because you will recognise the correct shape immediately rather than deducing it.

At 28% of the exam, this domain plus the operations domain is well over half your score. Time in the terminal is the highest-leverage thing you can do for the ACE.
