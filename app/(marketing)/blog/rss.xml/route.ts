import { getAllBlogPosts } from "@/lib/content/blog"
import { SITE_DESCRIPTION, SITE_NAME, getSiteUrl } from "@/lib/config/site"

export const dynamic = "force-static"

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function rfc822(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toUTCString()
}

export function GET(): Response {
  const siteUrl = getSiteUrl()
  const posts = getAllBlogPosts()

  const items = posts
    .map((post) => {
      const url = `${siteUrl}/blog/${post.slug}`
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${rfc822(post.date)}</pubDate>
${post.examCode ? `      <category>${escapeXml(post.examCode)}</category>\n` : ""}    </item>`
    })
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)} — Certification exam guides</title>
    <link>${siteUrl}/blog</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <atom:link href="${siteUrl}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
