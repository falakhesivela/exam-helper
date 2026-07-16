import type { ExamBlueprint } from "../types"

export const aifC01Blueprint: ExamBlueprint = {
  examCode: "AIF-C01",
  exam: "AWS Certified AI Practitioner",
  provider: "aws",
  questionCount: 65,
  durationMin: 90,
  passMark: 70,
  questionMix: { singleChoice: 0.85, multipleResponse: 0.15 },
  styleGuide: { scenarioHeavy: false },
  domains: [
    {
      id: "fundamentals-ai-ml",
      name: "Fundamentals of AI and ML",
      weightPercent: 20,
      topics: [
        "AI, ML, and deep learning terminology: models, algorithms, training, inference",
        "Types of learning: supervised, unsupervised, reinforcement",
        "The ML development lifecycle: data collection, training, evaluation, deployment",
        "Practical AI use cases and when AI/ML is (and is not) appropriate",
        "AWS managed AI services: SageMaker, Comprehend, Rekognition, Transcribe, Translate",
      ],
    },
    {
      id: "fundamentals-genai",
      name: "Fundamentals of Generative AI",
      weightPercent: 24,
      topics: [
        "Foundation model concepts: tokens, embeddings, prompts, context windows",
        "Generative AI use cases: summarization, chatbots, code and image generation",
        "The foundation model lifecycle: pre-training, fine-tuning, deployment, feedback",
        "Amazon Bedrock and PartyRock for building generative AI applications",
        "Advantages, limitations, and cost trade-offs of generative AI solutions",
      ],
    },
    {
      id: "applications-foundation-models",
      name: "Applications of Foundation Models",
      weightPercent: 28,
      topics: [
        "Model selection criteria: modality, latency, cost, customization options",
        "Inference parameters: temperature, top-p, max tokens",
        "Retrieval Augmented Generation (RAG) and vector databases, Bedrock Knowledge Bases",
        "Prompt engineering techniques: zero-shot, few-shot, chain-of-thought, templates",
        "Customization approaches: fine-tuning, continued pre-training, and when each applies",
        "Evaluating foundation model performance: benchmarks, human evaluation, relevance metrics",
      ],
    },
    {
      id: "responsible-ai",
      name: "Guidelines for Responsible AI",
      weightPercent: 14,
      topics: [
        "Responsible AI dimensions: fairness, bias, robustness, safety, veracity",
        "Bias sources in datasets and mitigation: balanced, representative training data",
        "Bedrock Guardrails and content filtering for safe model outputs",
        "Transparency and explainability: model cards, interpretable models, SageMaker Clarify",
        "Legal and social risks of generative AI: hallucinations, IP, harmful content",
      ],
    },
    {
      id: "security-compliance-governance",
      name: "Security, Compliance, and Governance for AI Solutions",
      weightPercent: 14,
      topics: [
        "Securing AI systems: IAM roles and policies, encryption, Macie, PrivateLink",
        "Shared responsibility model applied to AWS AI services",
        "Data governance for AI: data quality, lineage, retention, citizenship",
        "Compliance and audit: AWS Config, CloudTrail, Audit Manager, Artifact, AI service cards",
        "Governance strategies: policies, review cadences, monitoring model behavior over time",
      ],
    },
  ],
}
