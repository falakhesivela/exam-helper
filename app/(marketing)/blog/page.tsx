import type { Metadata } from "next"
import Link from "next/link"
import { LEGAL_THEME, MONO, SERIF } from "@/app/(legal)/legal-theme"
import { getAllBlogPosts } from "@/lib/content/blog"
import { getSiteUrl } from "@/lib/config/site"
import { CtaPanel, JsonLd, PageHeading } from "../marketing-ui"

const { ink, body, muted, border } = LEGAL_THEME

export const metadata: Metadata = {
  title: "Blog — Certification Exam Study Guides & Tips",
  description:
    "Study plans, domain deep-dives, and honest advice for AWS, Azure, Google Cloud, CompTIA, Cisco, and CISSP certification exams.",
  alternates: { canonical: "/blog" },
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

export default function BlogIndexPage() {
  const posts = getAllBlogPosts()
  const siteUrl = getSiteUrl()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Prepa Blog",
    description: metadata.description,
    url: `${siteUrl}/blog`,
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      datePublished: post.date,
      url: `${siteUrl}/blog/${post.slug}`,
    })),
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHeading
        title="The Prepa blog"
        kicker="Study plans, domain deep-dives, and honest exam advice"
      />

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {posts.map((post) => (
          <li key={post.slug} style={{ borderTop: `1px solid ${border}` }}>
            <Link href={`/blog/${post.slug}`} style={{ display: "block", padding: "22px 0" }}>
              <span style={{ display: "block", fontFamily: MONO, fontSize: "12px", letterSpacing: "0.06em", textTransform: "uppercase", color: muted, marginBottom: "6px" }}>
                {formatDate(post.date)}
                {post.examCode ? ` · ${post.examCode}` : ""}
              </span>
              <span style={{ display: "block", fontFamily: SERIF, fontSize: "23px", fontWeight: 500, lineHeight: 1.25, letterSpacing: "-0.015em", color: ink }}>
                {post.title}
              </span>
              <span style={{ display: "block", marginTop: "8px", fontSize: "15px", lineHeight: 1.65, color: body, maxWidth: "64ch" }}>
                {post.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <CtaPanel />
    </>
  )
}
