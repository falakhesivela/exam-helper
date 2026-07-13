import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { LEGAL_THEME, MONO, SERIF } from "@/app/(legal)/legal-theme"
import {
  getAllDomainPages,
  getDomainPage,
  getDomainPagesForExam,
  hasNotes,
} from "@/lib/content/domains"
import { getExamHubBySlug } from "@/lib/content/exams"
import { getBlogPostsForExam } from "@/lib/content/blog"
import { getExamBlueprint } from "@/lib/exams/registry"
import { SITE_AUTHOR, getSiteUrl } from "@/lib/config/site"
import {
  AuthorCard,
  Breadcrumb,
  Byline,
  CtaPanel,
  JsonLd,
  MarketingProse,
  PageHeading,
} from "../../../../marketing-ui"

const { ink, body, muted, border } = LEGAL_THEME

interface Params {
  slug: string
  domainSlug: string
}

export function generateStaticParams(): Params[] {
  return getAllDomainPages().map((page) => ({
    slug: page.examSlug,
    domainSlug: page.slug,
  }))
}

function metaDescription(
  page: NonNullable<ReturnType<typeof getDomainPage>>,
): string {
  if (page.notesDescription) return page.notesDescription
  return `${page.domain.name} is ${page.domain.weightPercent}% of the ${page.examCode} exam — about ${page.approxQuestions} questions. What the domain covers, its full topic list, and how much of your study time it deserves.`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug, domainSlug } = await params
  const page = getDomainPage(slug, domainSlug)
  if (!page) return {}

  const title = `${page.examCode}: ${page.domain.name} (${page.domain.weightPercent}% of the exam)`
  const canonical = `/exams/${page.examSlug}/domains/${page.slug}`

  return {
    title,
    description: metaDescription(page),
    alternates: { canonical },
    // Blueprint data alone is a templated, near-empty page. Keep it out of the
    // index until it carries written content.
    robots: hasNotes(page) ? undefined : { index: false, follow: true },
    openGraph: {
      title,
      description: metaDescription(page),
      type: "article",
      url: `${getSiteUrl()}${canonical}`,
    },
  }
}

export default async function DomainPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug, domainSlug } = await params
  const page = getDomainPage(slug, domainSlug)
  if (!page) notFound()

  const hub = getExamHubBySlug(page.examSlug)
  const blueprint = getExamBlueprint(page.examCode)
  const siblings = getDomainPagesForExam(page.examSlug)
  const relatedPosts = getBlogPostsForExam(page.examCode)
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}/exams/${page.examSlug}/domains/${page.slug}`

  const heaviest = page.rank === 1
  const lightest = page.rank === page.domainCount

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: `${page.examCode}: ${page.domain.name}`,
      description: metaDescription(page),
      url: pageUrl,
      inLanguage: "en",
      learningResourceType: "Study guide",
      educationalLevel: "Professional certification",
      teaches: page.domain.topics,
      about: page.exam,
      isPartOf: {
        "@type": "Course",
        name: hub?.title ?? page.exam,
        url: `${siteUrl}/exams/${page.examSlug}`,
      },
      author: {
        "@type": "Person",
        "@id": `${siteUrl}/about#author`,
        name: SITE_AUTHOR.name,
        url: `${siteUrl}/about`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Exams", item: `${siteUrl}/exams` },
        {
          "@type": "ListItem",
          position: 2,
          name: page.examCode,
          item: `${siteUrl}/exams/${page.examSlug}`,
        },
        { "@type": "ListItem", position: 3, name: page.domain.name, item: pageUrl },
      ],
    },
  ]

  return (
    <article>
      <JsonLd data={jsonLd} />
      <Breadcrumb
        items={[
          { href: "/exams", label: "Exams" },
          { href: `/exams/${page.examSlug}`, label: page.examCode },
          { label: "Domain" },
        ]}
      />
      <PageHeading
        title={page.domain.name}
        kicker={`${page.examCode} · Domain ${page.rank} of ${page.domainCount} by weight`}
      />

      <Byline date={hub ? `Updated ${hub.updated}` : undefined} />

      <section
        aria-label="Domain facts"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "18px 24px", borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`, padding: "20px 0", marginBottom: "28px" }}
      >
        <div>
          <div style={{ fontFamily: MONO, fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: muted, marginBottom: "4px" }}>
            Exam weight
          </div>
          <div style={{ fontFamily: SERIF, fontSize: "22px", fontWeight: 500, color: ink }}>
            {page.domain.weightPercent}%
          </div>
        </div>
        <div>
          <div style={{ fontFamily: MONO, fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: muted, marginBottom: "4px" }}>
            Approx. questions
          </div>
          <div style={{ fontFamily: SERIF, fontSize: "22px", fontWeight: 500, color: ink }}>
            ~{page.approxQuestions}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: MONO, fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: muted, marginBottom: "4px" }}>
            Topics
          </div>
          <div style={{ fontFamily: SERIF, fontSize: "22px", fontWeight: 500, color: ink }}>
            {page.domain.topics.length}
          </div>
        </div>
      </section>

      <p style={{ fontSize: "16px", lineHeight: 1.75, color: body, margin: "0 0 28px" }}>
        <strong style={{ color: ink }}>{page.domain.name}</strong> accounts for{" "}
        {page.domain.weightPercent}% of the {page.exam} — roughly{" "}
        {page.approxQuestions} of the {blueprint?.questionCount} questions you
        will see.{" "}
        {heaviest
          ? "It is the heaviest domain on the exam, so it decides more of your score than any other, and weakness here cannot be offset elsewhere."
          : lightest
            ? "It is the lightest domain on the exam — worth knowing, but not worth over-investing in at the expense of heavier ones."
            : `It ranks ${page.rank} of ${page.domainCount} by weight, so it deserves proportionate — not equal — study time.`}
      </p>

      {page.notes ? <MarketingProse>{page.notes}</MarketingProse> : null}

      <section style={{ marginTop: "36px" }}>
        <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "24px", letterSpacing: "-0.015em", color: ink, margin: "0 0 12px" }}>
          What this domain covers
        </h2>
        <ul style={{ margin: 0, padding: "0 0 0 20px", fontSize: "15.5px", lineHeight: 1.7, color: body }}>
          {page.domain.topics.map((topic) => (
            <li key={topic} style={{ marginBottom: "6px" }}>
              {topic}
            </li>
          ))}
        </ul>
        <p style={{ fontSize: "14px", color: muted, marginTop: "14px" }}>
          These are the topics Prepa uses to generate {page.examCode} practice
          questions for this domain, so your practice is weighted the way the
          exam is.
        </p>
      </section>

      <section style={{ marginTop: "40px" }}>
        <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "24px", letterSpacing: "-0.015em", color: ink, margin: "0 0 12px" }}>
          The other {page.examCode} domains
        </h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {siblings.map((sibling) => {
            const current = sibling.slug === page.slug
            return (
              <li key={sibling.slug} style={{ borderTop: `1px solid ${border}` }}>
                {current ? (
                  <span style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "12px 0", fontSize: "15.5px", color: muted }}>
                    <span>{sibling.domain.name} (this page)</span>
                    <span style={{ fontFamily: MONO }}>{sibling.domain.weightPercent}%</span>
                  </span>
                ) : (
                  <Link
                    href={`/exams/${sibling.examSlug}/domains/${sibling.slug}`}
                    style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "12px 0", fontSize: "15.5px", color: ink }}
                  >
                    <span>{sibling.domain.name}</span>
                    <span style={{ fontFamily: MONO, color: muted }}>
                      {sibling.domain.weightPercent}%
                    </span>
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
        <p style={{ fontSize: "15.5px", lineHeight: 1.7, color: body, marginTop: "16px" }}>
          For the full exam format, scoring, and a study plan, read the{" "}
          <Link href={`/exams/${page.examSlug}`} className="mkt-link">
            {hub?.title ?? `${page.examCode} study guide`}
          </Link>
          .
        </p>
      </section>

      {relatedPosts.length > 0 ? (
        <section style={{ marginTop: "40px" }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "24px", letterSpacing: "-0.015em", color: ink, margin: "0 0 12px" }}>
            Related reading
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

      <AuthorCard />
      <CtaPanel examName={page.exam} />
    </article>
  )
}
