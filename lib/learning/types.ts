export interface CatalogTopic {
  slug: string
  name: string
  outline: string[]
  references: { label: string; url: string }[]
}

export interface CatalogDomain {
  id: string
  name: string
  weight: string
  topics: CatalogTopic[]
}

export interface ExamCatalog {
  examCode: string
  exam: string
  domains: CatalogDomain[]
}

export interface ResolvedCatalogTopic extends CatalogTopic {
  domainId: string
  domainName: string
  domainWeight: string
}
