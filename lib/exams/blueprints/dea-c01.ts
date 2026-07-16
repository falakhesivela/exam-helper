import type { ExamBlueprint } from "../types"

export const deaC01Blueprint: ExamBlueprint = {
  examCode: "DEA-C01",
  exam: "AWS Certified Data Engineer – Associate",
  provider: "aws",
  questionCount: 65,
  durationMin: 130,
  passMark: 72,
  questionMix: { singleChoice: 0.7, multipleResponse: 0.3 },
  styleGuide: { scenarioHeavy: true, servicesShortNames: true },
  domains: [
    {
      id: "data-ingestion-transformation",
      name: "Data Ingestion and Transformation",
      weightPercent: 34,
      topics: [
        "Streaming ingestion: Kinesis Data Streams, Data Firehose, MSK, throughput and batching",
        "Batch ingestion: AppFlow, DMS, DataSync, Snow family, scheduled and event-driven loads",
        "ETL with Glue: jobs, crawlers, bookmarks, DataBrew, and Spark on EMR",
        "Stateless transforms with Lambda; container-based processing on ECS/EKS",
        "Pipeline orchestration: Step Functions, MWAA (Airflow), EventBridge schedules",
        "Programming concepts: SQL transforms, partitioning, CI/CD for data pipelines",
      ],
    },
    {
      id: "data-store-management",
      name: "Data Store Management",
      weightPercent: 26,
      topics: [
        "Choosing data stores: S3, Redshift, DynamoDB, RDS, OpenSearch by access pattern",
        "Data lake design on S3: formats (Parquet, Avro), partitioning, compression",
        "Lake Formation permissions and governed data lakes",
        "Glue Data Catalog: schemas, crawlers, schema evolution",
        "Data modeling: star schemas, indexing, distribution and sort keys in Redshift",
        "Lifecycle management: S3 storage classes, tiering, retention, versioning",
      ],
    },
    {
      id: "data-operations-support",
      name: "Data Operations and Support",
      weightPercent: 22,
      topics: [
        "Automating pipeline operations with Lambda, Systems Manager, and EventBridge",
        "Analyzing data with Athena, Redshift queries, and QuickSight surface views",
        "Pipeline monitoring: CloudWatch metrics/logs, CloudTrail, Glue job observability",
        "Data quality rules with Glue Data Quality: completeness, freshness, accuracy checks",
        "Troubleshooting failed jobs, skewed partitions, and throughput bottlenecks",
      ],
    },
    {
      id: "data-security-governance",
      name: "Data Security and Governance",
      weightPercent: 18,
      topics: [
        "IAM for data workloads: roles, resource policies, least privilege, cross-account access",
        "Encryption with KMS at rest and TLS in transit; S3 bucket policies",
        "Sensitive data discovery and masking: Macie, redaction patterns, PII handling",
        "VPC networking for data services: endpoints, security groups, private subnets",
        "Audit and governance: CloudTrail, Lake Formation permissions, data sharing controls",
      ],
    },
  ],
}
