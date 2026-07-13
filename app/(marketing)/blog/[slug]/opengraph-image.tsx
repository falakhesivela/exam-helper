import { notFound } from "next/navigation"
import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/content/blog"
import { getSiteUrl } from "@/lib/config/site"
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "../../og-template"

export const alt = "Prepa blog post"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }))
}

export default async function BlogOgImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)
  if (!post) notFound()

  const host = getSiteUrl().replace(/^https?:\/\//, "")

  return renderOgImage({
    kicker: post.examCode ? `${post.examCode} · Guide` : "Prepa blog",
    title: post.title,
    footer: `Free AI practice questions · ${host}`,
  })
}
