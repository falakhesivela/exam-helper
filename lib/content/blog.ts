import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

/** Frontmatter + body for a blog post (content/blog/{slug}.md). */
export interface BlogPostDoc {
  slug: string
  title: string
  description: string
  /** Optional exam preset code linking the post to its hub page. */
  examCode: string | null
  /** ISO publish date, used for sorting, metadata, and JSON-LD. */
  date: string
  body: string
}

const CONTENT_DIR = path.join(process.cwd(), "content", "blog")

function parseFile(filePath: string): BlogPostDoc {
  const raw = fs.readFileSync(filePath, "utf8")
  const { data, content } = matter(raw)
  return {
    slug: String(data.slug),
    title: String(data.title),
    description: String(data.description),
    examCode: data.examCode ? String(data.examCode) : null,
    date: String(data.date),
    body: content.trim(),
  }
}

export function getAllBlogPosts(): BlogPostDoc[] {
  if (!fs.existsSync(CONTENT_DIR)) return []
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => parseFile(path.join(CONTENT_DIR, file)))
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title))
}

export function getBlogPostBySlug(slug: string): BlogPostDoc | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return null
  return parseFile(filePath)
}

export function getBlogPostsForExam(examCode: string): BlogPostDoc[] {
  return getAllBlogPosts().filter(
    (post) => post.examCode?.toUpperCase() === examCode.toUpperCase(),
  )
}
