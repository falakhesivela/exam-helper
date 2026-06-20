export type ExamProvider =
  | "aws"
  | "azure"
  | "gcp"
  | "comptia"
  | "cisco"
  | "isc2"
  | "custom"

export interface ExamBlueprintDomain {
  id: string
  name: string
  weightPercent: number
  /** Outline bullets used to ground AI question generation. */
  topics: string[]
}

export interface ExamBlueprint {
  examCode: string
  exam: string
  provider: ExamProvider
  questionCount: number
  durationMin: number
  passMark: number
  questionMix: { singleChoice: number; multipleResponse: number }
  /** Fraction of questions per drag type (remainder is MCQ). */
  questionTypeMix?: {
    drag_match?: number
    drag_order?: number
    drag_categorize?: number
  }
  styleGuide?: {
    scenarioHeavy?: boolean
    servicesShortNames?: boolean
    managerialTone?: boolean
  }
  domains: ExamBlueprintDomain[]
}

export interface DomainAllocation {
  domain: ExamBlueprintDomain
  count: number
}
