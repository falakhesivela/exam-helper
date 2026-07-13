import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/config/site"
import { getAllExamHubs } from "@/lib/content/exams"
import { getAllBlogPosts } from "@/lib/content/blog"

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()
  const lastModified = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/exams`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/signup`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/login`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/refund`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ]

  const examEntries: MetadataRoute.Sitemap = getAllExamHubs().map((doc) => ({
    url: `${siteUrl}/exams/${doc.slug}`,
    lastModified: new Date(`${doc.updated}T00:00:00Z`),
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  const blogEntries: MetadataRoute.Sitemap = getAllBlogPosts().map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(`${post.date}T00:00:00Z`),
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  return [...staticEntries, ...examEntries, ...blogEntries]
}
