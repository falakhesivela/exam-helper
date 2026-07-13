import type { Metadata } from "next"
import Link from "next/link"
import { LEGAL_THEME, MONO, SERIF } from "@/app/(legal)/legal-theme"
import { getAllExamHubs } from "@/lib/content/exams"
import { slugForExamCode } from "@/lib/content/exam-slugs"
import { listExamPresetsByProvider } from "@/lib/exams/registry"
import { getSiteUrl } from "@/lib/config/site"
import { CtaPanel, JsonLd, PageHeading, PROVIDER_NAMES } from "../marketing-ui"

const { ink, body, muted, border } = LEGAL_THEME

export const metadata: Metadata = {
  title: "Certification Exam Guides — AWS, Azure, CompTIA, Cisco & More",
  description:
    "Free study guides for AWS, Azure, Google Cloud, CompTIA, Cisco, and CISSP certification exams: domains, weights, format, pass marks, and how to prepare.",
  alternates: { canonical: "/exams" },
}

export default function ExamsIndexPage() {
  const siteUrl = getSiteUrl()
  const hubs = new Map(getAllExamHubs().map((doc) => [doc.examCode, doc]))
  const groups = listExamPresetsByProvider()

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Certification Exam Guides",
    description: metadata.description,
    url: `${siteUrl}/exams`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: groups
        .flatMap((group) => group.presets)
        .map((preset, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${preset.exam} (${preset.examCode})`,
          url: `${siteUrl}/exams/${slugForExamCode(preset.examCode)}`,
        })),
    },
  }

  return (
    <>
      <JsonLd data={itemListJsonLd} />
      <PageHeading
        title="Certification exam guides"
        kicker="Domains, weights, format, and how to prepare"
      />
      <p style={{ fontSize: "16px", lineHeight: 1.7, color: body, margin: "0 0 36px", maxWidth: "60ch" }}>
        Everything you need to know before you book: what each exam covers, how
        it&apos;s weighted, what the pass mark is, and a preparation strategy
        that works. Each guide is kept in sync with the official exam
        blueprint.
      </p>

      {groups.map((group) => (
        <section key={group.provider} style={{ marginBottom: "36px" }}>
          <h2 style={{ fontFamily: MONO, fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase", color: muted, margin: "0 0 14px" }}>
            {PROVIDER_NAMES[group.provider]}
          </h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {group.presets.map((preset) => {
              const slug = slugForExamCode(preset.examCode)
              const doc = hubs.get(preset.examCode)
              if (!slug) return null
              return (
                <li key={preset.examCode} style={{ borderTop: `1px solid ${border}` }}>
                  <Link href={`/exams/${slug}`} style={{ display: "block", padding: "16px 0" }}>
                    <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px" }}>
                      <span style={{ fontFamily: SERIF, fontSize: "20px", fontWeight: 500, letterSpacing: "-0.01em", color: ink }}>
                        {preset.exam}
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: "12px", letterSpacing: "0.05em", color: muted, whiteSpace: "nowrap" }}>
                        {preset.examCode}
                      </span>
                    </span>
                    {doc ? (
                      <span style={{ display: "block", marginTop: "6px", fontSize: "14.5px", lineHeight: 1.6, color: body, maxWidth: "62ch" }}>
                        {doc.description}
                      </span>
                    ) : null}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <CtaPanel />
    </>
  )
}
