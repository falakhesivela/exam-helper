import type { ExamBlueprint } from "../types"

export const aipC01Blueprint: ExamBlueprint = {
  examCode: "AIP-C01",
  exam: "AWS Certified Generative AI Developer – Professional",
  provider: "aws",
  questionCount: 75,
  durationMin: 180,
  passMark: 75,
  questionMix: { singleChoice: 0.65, multipleResponse: 0.35 },
  styleGuide: { scenarioHeavy: true, servicesShortNames: true },
  domains: [
    {
      id: "fm-integration-data-compliance",
      name: "Foundation Model Integration, Data Management, and Compliance",
      weightPercent: 31,
      topics: [
        "Architecting GenAI solutions: model selection, integration patterns, Well-Architected GenAI Lens",
        "Configuring FMs on Bedrock: cross-Region inference, provider switching, resilient fallbacks",
        "Fine-tuned model lifecycle: SageMaker deployment, LoRA adapters, Model Registry, rollback",
        "Data pipelines for FM consumption: validation, multimodal processing, input formatting",
        "Vector stores and RAG: Bedrock Knowledge Bases, OpenSearch vector search, Aurora pgvector",
        "Retrieval design: chunking strategies, embeddings, hybrid search, rerankers, query expansion",
        "Prompt engineering and governance: Bedrock Prompt Management, templates, prompt regression testing",
      ],
    },
    {
      id: "implementation-integration",
      name: "Implementation and Integration",
      weightPercent: 26,
      topics: [
        "Agentic AI: multi-agent systems, MCP tool integration, ReAct patterns with Step Functions",
        "Agent safeguards: stopping conditions, timeouts, IAM resource boundaries, circuit breakers",
        "Model deployment: Bedrock provisioned throughput, SageMaker endpoints, model cascading",
        "Enterprise integration: API Gateway microservices, EventBridge, identity federation, GenAI gateways",
        "FM API patterns: streaming responses, async processing with SQS, exponential backoff, rate limiting",
        "Intelligent model routing and human-in-the-loop review workflows",
      ],
    },
    {
      id: "ai-safety-security-governance",
      name: "AI Safety, Security, and Governance",
      weightPercent: 20,
      topics: [
        "Input/output safety controls: Bedrock Guardrails, content filtering, prompt injection defenses",
        "Data security and privacy: PII detection and redaction, encryption, data residency",
        "Access control for GenAI: least-privilege model access, tenant isolation, audit trails",
        "AI governance: usage policies, approval workflows, CloudTrail model invocation logging",
        "Responsible AI: bias monitoring, hallucination mitigation, transparency and attribution",
      ],
    },
    {
      id: "operational-efficiency-optimization",
      name: "Operational Efficiency and Optimization for GenAI Applications",
      weightPercent: 12,
      topics: [
        "Cost optimization: token usage management, model right-sizing, caching, batch inference",
        "Performance tuning: latency reduction, streaming, prompt caching, concurrency management",
        "Monitoring GenAI apps: invocation metrics, token counts, quality dashboards in CloudWatch",
        "Capacity planning: provisioned throughput vs on-demand, quota management",
      ],
    },
    {
      id: "testing-validation-troubleshooting",
      name: "Testing, Validation, and Troubleshooting",
      weightPercent: 11,
      topics: [
        "Evaluating GenAI output: automated evaluation pipelines, LLM-as-judge, golden datasets",
        "Regression testing prompts and RAG retrieval quality",
        "Troubleshooting: throttling errors, context window overflows, malformed tool calls",
        "Debugging with X-Ray traces, CloudWatch Logs, and Bedrock invocation logs",
      ],
    },
  ],
}
