/**
 * Stable, SEO-friendly URL slugs for each exam preset. These power the public
 * hub pages at /exams/[slug] and must never change once indexed — add
 * redirects instead of editing existing values.
 */
export const EXAM_SLUGS = {
  "SAA-C03": "saa-c03",
  "CLF-C02": "clf-c02",
  "AIF-C01": "aif-c01",
  "DVA-C02": "dva-c02",
  "SOA-C03": "soa-c03",
  "DEA-C01": "dea-c01",
  "MLA-C01": "mla-c01",
  "SAP-C02": "sap-c02",
  "DOP-C02": "dop-c02",
  "AIP-C01": "aip-c01",
  "ANS-C01": "ans-c01",
  "SCS-C03": "scs-c03",
  "AZ-900": "az-900",
  "AZ-104": "az-104",
  "GCP-ACE": "gcp-ace",
  "SY0-701": "comptia-security-plus",
  "220-1101": "comptia-a-plus-core-1",
  "N10-009": "comptia-network-plus",
  "200-301": "ccna-200-301",
  CISSP: "cissp",
} as const satisfies Record<string, string>

const SLUG_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(EXAM_SLUGS).map(([code, slug]) => [slug, code]),
)

export function slugForExamCode(examCode: string): string | null {
  return EXAM_SLUGS[examCode.toUpperCase() as keyof typeof EXAM_SLUGS] ?? null
}

export function examCodeForSlug(slug: string): string | null {
  return SLUG_TO_CODE[slug.toLowerCase()] ?? null
}
