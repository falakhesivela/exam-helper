import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/config/site"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/practice",
          "/exam",
          "/quiz/",
          "/learn",
          "/plan",
          "/history",
          "/intake",
          "/profile",
          "/team",
          "/upgrade",
          "/checkout",
          "/auth/",
          "/~offline",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
