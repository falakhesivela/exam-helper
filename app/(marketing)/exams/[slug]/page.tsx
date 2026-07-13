import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { LEGAL_THEME, MONO, SERIF } from "@/app/(legal)/legal-theme"
import { getAllExamHubs, getExamHubBySlug } from "@/lib/content/exams"
import { getBlogPostsForExam } from "@/lib/content/blog"
import { getExamBlueprint } from "@/lib/exams/registry"
import { getSiteUrl } from "@/lib/config/site"
import {
  Breadcrumb,
  CtaPanel,
  JsonLd,
  MarketingProse,
  PageHeading,
  PROVIDER_NAMES,
} from "../../marketing-ui"

const { ink, body, muted, border } = LEGAL_THEME

interface Params {
  slug: string
}

export function generateStaticParams(): Params[] {
  return getAllExamHubs().map((doc) => ({ slug: doc.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const doc = getExamHubBySlug(slug)
  if (!doc) return {}
  return {
    title: doc.title,
    description: doc.description,
    alternates: { canonical: `/exams/${doc.slug}` },
    openGraph: {
      title: doc.title,
      description: doc.description,
      type: "article",
      url: `${getSiteUrl()}/exams/${doc.slug}`,
    },
  }
}

function FactCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: muted, marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontFamily: SERIF, fontSize: "22px", fontWeight: 500, color: ink }}>
        {value}
      </div>
    </div>
  )
}

export default async function ExamHubPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const doc = getExamHubBySlug(slug)
  if (!doc) notFound()

  const blueprint = getExamBlueprint(doc.examCode)
  const relatedPosts = getBlogPostsForExam(doc.examCode)
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}/exams/${doc.slug}`

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: doc.title,
      description: doc.description,
      url: pageUrl,
      provider: { "@type": "Organization", name: "Prepa", url: siteUrl },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        category: "Free tier",
      },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        courseWorkload: "PT10H",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Exams", item: `${siteUrl}/exams` },
        { "@type": "ListItem", position: 2, name: doc.title, item: pageUrl },
      ],
    },
  ]

  return (
    <article>
      <JsonLd data={jsonLd} />
      <Breadcrumb
        items={[
          { href: "/exams", label: "Exams" },
          { label: doc.examCode },
        ]}
      />
      <PageHeading
        title={doc.title}
        kicker={
          blueprint
            ? `${PROVIDER_NAMES[blueprint.provider]} · ${blueprint.examCode} · Updated ${doc.updated}`
            : `Updated ${doc.updated}`
        }
      />

      {blueprint ? (
        <>
          <section
            aria-label="Exam facts"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "18px 24px", borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`, padding: "20px 0", marginBottom: "32px" }}
          >
            <FactCell label="Questions" value={String(blueprint.questionCount)} />
            <FactCell label="Duration" value={`${blueprint.durationMin} min`} />
            <FactCell label="Pass mark" value={`${blueprint.passMark}%`} />
            <FactCell label="Domains" value={String(blueprint.domains.length)} />
          </section>

          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "24px", letterSpacing: "-0.015em", color: ink, margin: "0 0 14px" }}>
              Exam domains and weights
            </h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14.5px" }}>
              <thead>
                <tr>
                  <th style={{ fontFamily: MONO, fontSize: "12px", letterSpacing: "0.06em", textTransform: "uppercase", color: muted, textAlign: "left", padding: "8px 12px 8px 0", borderBottom: `1px solid ${border}` }}>
                    Domain
                  </th>
                  <th style={{ fontFamily: MONO, fontSize: "12px", letterSpacing: "0.06em", textTransform: "uppercase", color: muted, textAlign: "right", padding: "8px 0", borderBottom: `1px solid ${border}` }}>
                    Weight
                  </th>
                </tr>
              </thead>
              <tbody>
                {blueprint.domains.map((domain) => (
                  <tr key={domain.id}>
                    <td style={{ padding: "10px 12px 10px 0", borderBottom: `1px solid ${border}`, color: body }}>
                      {domain.name}
                    </td>
                    <td style={{ padding: "10px 0", borderBottom: `1px solid ${border}`, textAlign: "right", fontFamily: MONO, color: ink }}>
                      {domain.weightPercent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      ) : null}

      <MarketingProse>{doc.body}</MarketingProse>

      {relatedPosts.length > 0 ? (
        <section style={{ marginTop: "40px" }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "24px", letterSpacing: "-0.015em", color: ink, margin: "0 0 12px" }}>
            From the blog
          </h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {relatedPosts.map((post) => (
              <li key={post.slug} style={{ borderTop: `1px solid ${border}` }}>
                <Link href={`/blog/${post.slug}`} style={{ display: "block", padding: "14px 0" }}>
                  <span style={{ display: "block", fontSize: "16.5px", fontWeight: 600, letterSpacing: "-0.01em", color: ink }}>
                    {post.title}
                  </span>
                  <span style={{ display: "block", marginTop: "4px", fontSize: "14px", lineHeight: 1.6, color: body }}>
                    {post.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <CtaPanel examName={blueprint?.exam} />
    </article>
  )
}
