import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/config/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()
  const lastModified = new Date()

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
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
}
