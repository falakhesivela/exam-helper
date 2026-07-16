import type { ExamBlueprint } from "../types"

export const mlaC01Blueprint: ExamBlueprint = {
  examCode: "MLA-C01",
  exam: "AWS Certified Machine Learning Engineer – Associate",
  provider: "aws",
  questionCount: 65,
  durationMin: 130,
  passMark: 72,
  questionMix: { singleChoice: 0.7, multipleResponse: 0.3 },
  styleGuide: { scenarioHeavy: true, servicesShortNames: true },
  domains: [
    {
      id: "data-preparation",
      name: "Data Preparation for Machine Learning",
      weightPercent: 28,
      topics: [
        "Ingesting and storing ML data: S3, EFS, FSx, streaming with Kinesis",
        "Data formats and trade-offs: Parquet, JSON, CSV, RecordIO",
        "Transformation and cleaning with SageMaker Data Wrangler, Glue, and EMR",
        "Feature engineering: encoding, scaling, binning; SageMaker Feature Store",
        "Data integrity: class imbalance, leakage, bias detection with SageMaker Clarify",
        "Labeling with SageMaker Ground Truth",
      ],
    },
    {
      id: "model-development",
      name: "ML Model Development",
      weightPercent: 26,
      topics: [
        "Choosing a modeling approach: built-in algorithms, custom training, Bedrock foundation models",
        "Training with SageMaker: jobs, script mode, distributed training, spot training",
        "Hyperparameter tuning: SageMaker AMT, search strategies, early stopping",
        "Model evaluation: precision/recall, F1, AUC, RMSE, overfitting vs underfitting",
        "Fine-tuning foundation models and transfer learning",
        "Experiment tracking and model versioning: SageMaker Experiments, Model Registry",
      ],
    },
    {
      id: "deployment-orchestration",
      name: "Deployment and Orchestration of ML Workflows",
      weightPercent: 22,
      topics: [
        "Deployment targets: real-time endpoints, serverless inference, batch transform, async inference",
        "Endpoint scaling, multi-model endpoints, and inference cost/performance trade-offs",
        "Provisioning ML infrastructure with CloudFormation and CDK; containers on ECR",
        "CI/CD for ML: SageMaker Pipelines, CodePipeline, automated retraining triggers",
        "Orchestration with Step Functions and EventBridge",
      ],
    },
    {
      id: "monitoring-maintenance-security",
      name: "ML Solution Monitoring, Maintenance, and Security",
      weightPercent: 24,
      topics: [
        "Model monitoring: data drift, model quality drift, SageMaker Model Monitor",
        "Infrastructure monitoring: CloudWatch metrics/logs, X-Ray, endpoint invocation metrics",
        "Cost monitoring and optimization: instance right-sizing, savings plans, tagging",
        "Securing ML resources: IAM roles, VPC configs for SageMaker, encryption with KMS",
        "Audit and compliance: CloudTrail, artifact lineage, SageMaker Role Manager",
      ],
    },
  ],
}
