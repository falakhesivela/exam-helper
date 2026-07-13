import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/config/site"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: "*",
        // Disallow paths are prefix matches, so bare "/exam" would also block
        // the public "/exams/*" guides. Anchor the app routes with "$" and "/".
        allow: ["/", "/exams", "/exams/"],
        disallow: [
          "/api/",
          "/dashboard$",
          "/dashboard/",
          "/learn$",
          "/learn/",
          "/practice$",
          "/practice/",
          "/study$",
          "/study/",
          "/exam$",
          "/exam/",
          "/quiz/",
          "/plan$",
          "/plan/",
          "/history$",
          "/history/",
          "/intake$",
          "/intake/",
          "/profile$",
          "/profile/",
          "/team$",
          "/team/",
          "/upgrade$",
          "/upgrade/",
          "/checkout$",
          "/checkout/",
          "/auth/",
          "/~offline",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
