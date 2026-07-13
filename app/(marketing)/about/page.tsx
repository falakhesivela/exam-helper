import type { Metadata } from "next"
import Link from "next/link"
import { LEGAL_THEME, SERIF } from "@/app/(legal)/legal-theme"
import { SITE_AUTHOR, SITE_NAME, getSiteUrl } from "@/lib/config/site"
import { getAllExamHubs } from "@/lib/content/exams"
import { getAllBlogPosts } from "@/lib/content/blog"
import { Breadcrumb, CtaPanel, JsonLd, PageHeading } from "../marketing-ui"

const { ink, body, border } = LEGAL_THEME

export const metadata: Metadata = {
  title: `About ${SITE_AUTHOR.name}`,
  description: `${SITE_AUTHOR.name} writes the certification exam guides on ${SITE_NAME} and builds the exam blueprints and question generators behind the app.`,
  alternates: { canonical: "/about" },
}

export default function AboutPage() {
  const siteUrl = getSiteUrl()
  const guides = getAllExamHubs()
  const posts = getAllBlogPosts()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      "@id": `${siteUrl}/about#author`,
      name: SITE_AUTHOR.name,
      url: `${siteUrl}/about`,
      jobTitle: SITE_AUTHOR.role,
      description: SITE_AUTHOR.bio,
      worksFor: { "@id": `${siteUrl}/#organization` },
      ...(SITE_AUTHOR.sameAs.length > 0 ? { sameAs: SITE_AUTHOR.sameAs } : {}),
    },
  }

  return (
    <article>
      <JsonLd data={jsonLd} />
      <Breadcrumb items={[{ label: "About" }]} />
      <PageHeading title={SITE_AUTHOR.name} kicker={SITE_AUTHOR.role} />

      <div style={{ fontSize: "16px", lineHeight: 1.75, color: body }}>
        <p style={{ margin: "0 0 16px" }}>{SITE_AUTHOR.bio}</p>
        <p style={{ margin: "0 0 16px" }}>
          Everything published here is written against the official exam
          blueprints — the same domain lists and weightings that {SITE_NAME}{" "}
          uses to generate practice questions and build study plans. When an
          exam objective changes, the guide, the question generator, and the
          readiness score all move together, because they read from one source.
        </p>
        <p style={{ margin: "0 0 16px" }}>
          There are no dumps here and no leaked questions. Recycled question
          banks teach you the answer to a question you will never see again;
          they do not teach you to reason from a scenario, which is the only
          thing the exam actually measures.
        </p>
      </div>

      <section style={{ marginTop: "36px", paddingTop: "24px", borderTop: `1px solid ${border}` }}>
        <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "24px", letterSpacing: "-0.015em", color: ink, margin: "0 0 12px" }}>
          What I write here
        </h2>
        <p style={{ fontSize: "15.5px", lineHeight: 1.7, color: body, margin: "0 0 14px" }}>
          {guides.length} exam study guides covering the domains, weights, and
          format of each certification, and {posts.length} deeper posts on study
          plans and the topics candidates most often fail on.
        </p>
        <p style={{ fontSize: "15.5px", lineHeight: 1.7, color: body, margin: 0 }}>
          Start with the{" "}
          <Link href="/exams" className="mkt-link">
            exam guides
          </Link>{" "}
          or the{" "}
          <Link href="/blog" className="mkt-link">
            blog
          </Link>
          .
        </p>
      </section>

      <CtaPanel />
    </article>
  )
}
