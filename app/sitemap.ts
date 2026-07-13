import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/config/site"
import { getAllExamHubs } from "@/lib/content/exams"
import { getIndexableDomainPages } from "@/lib/content/domains"
import { getAllBlogPosts } from "@/lib/content/blog"

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()
  const exams = getAllExamHubs()
  const posts = getAllBlogPosts()

  const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`)

  // Crawlers distrust a lastmod that moves on every deploy, so index pages
  // inherit the freshest date of the content they list rather than "now".
  const newest = (dates: string[]) =>
    dates.length > 0 ? toDate(dates.slice().sort().reverse()[0]) : new Date()

  const examsUpdated = newest(exams.map((doc) => doc.updated))
  const blogUpdated = newest(posts.map((post) => post.updated))
  const siteUpdated = new Date(
    Math.max(examsUpdated.getTime(), blogUpdated.getTime()),
  )

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: siteUpdated,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/exams`,
      lastModified: examsUpdated,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: blogUpdated,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/signup`,
      lastModified: siteUpdated,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: siteUpdated,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: siteUpdated,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: siteUpdated,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/refund`,
      lastModified: siteUpdated,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ]

  const examEntries: MetadataRoute.Sitemap = exams.map((doc) => ({
    url: `${siteUrl}/exams/${doc.slug}`,
    lastModified: toDate(doc.updated),
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: toDate(post.updated),
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  // Domain pages without written notes are noindexed, so they stay out.
  const examUpdatedBySlug = new Map(exams.map((doc) => [doc.slug, doc.updated]))
  const domainEntries: MetadataRoute.Sitemap = getIndexableDomainPages().map(
    (page) => ({
      url: `${siteUrl}/exams/${page.examSlug}/domains/${page.slug}`,
      lastModified: toDate(
        examUpdatedBySlug.get(page.examSlug) ?? examsUpdated.toISOString().slice(0, 10),
      ),
      changeFrequency: "monthly",
      priority: 0.7,
    }),
  )

  return [...staticEntries, ...examEntries, ...domainEntries, ...blogEntries]
}
