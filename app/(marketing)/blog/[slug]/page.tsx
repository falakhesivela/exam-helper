import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { LEGAL_THEME } from "@/app/(legal)/legal-theme"
import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/content/blog"
import { getExamHubBySlug } from "@/lib/content/exams"
import { slugForExamCode } from "@/lib/content/exam-slugs"
import { getExamBlueprint } from "@/lib/exams/registry"
import { getSiteUrl, SITE_AUTHOR, SITE_NAME } from "@/lib/config/site"
import {
  AuthorCard,
  Breadcrumb,
  Byline,
  CtaPanel,
  JsonLd,
  MarketingProse,
  PageHeading,
} from "../../marketing-ui"

const { body, border } = LEGAL_THEME

interface Params {
  slug: string
}

export function generateStaticParams(): Params[] {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updated,
      url: `${getSiteUrl()}/blog/${post.slug}`,
    },
  }
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)
  if (!post) notFound()

  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}/blog/${post.slug}`
  const examSlug = post.examCode ? slugForExamCode(post.examCode) : null
  const hub = examSlug ? getExamHubBySlug(examSlug) : null
  const blueprint = post.examCode ? getExamBlueprint(post.examCode) : null

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.updated,
      url: pageUrl,
      mainEntityOfPage: pageUrl,
      inLanguage: "en",
      about: blueprint?.exam ?? undefined,
      author: {
        "@type": "Person",
        "@id": `${siteUrl}/about#author`,
        name: SITE_AUTHOR.name,
        url: `${siteUrl}/about`,
        jobTitle: SITE_AUTHOR.role,
      },
      publisher: { "@type": "Organization", name: SITE_NAME, url: siteUrl },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Blog", item: `${siteUrl}/blog` },
        { "@type": "ListItem", position: 2, name: post.title, item: pageUrl },
      ],
    },
  ]

  return (
    <article>
      <JsonLd data={jsonLd} />
      <Breadcrumb
        items={[
          { href: "/blog", label: "Blog" },
          { label: formatDate(post.date) },
        ]}
      />
      <PageHeading
        title={post.title}
        kicker={
          post.examCode
            ? `${formatDate(post.date)} · ${post.examCode}`
            : formatDate(post.date)
        }
      />

      <Byline date={formatDate(post.date)} />

      <MarketingProse>{post.body}</MarketingProse>

      {hub && examSlug ? (
        <p style={{ marginTop: "36px", paddingTop: "24px", borderTop: `1px solid ${border}`, fontSize: "15.5px", lineHeight: 1.65, color: body }}>
          Preparing for {blueprint ? `the ${blueprint.exam}` : "this exam"}? Read
          the full{" "}
          <Link href={`/exams/${examSlug}`} className="mkt-link">
            {hub.title}
          </Link>{" "}
          for domains, weights, and format details.
        </p>
      ) : null}

      <AuthorCard />
      <CtaPanel examName={blueprint?.exam} />
    </article>
  )
}
