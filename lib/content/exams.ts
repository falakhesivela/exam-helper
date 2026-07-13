import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

/** Frontmatter + body for a public exam hub page (content/exams/{slug}.md). */
export interface ExamHubDoc {
  slug: string
  title: string
  description: string
  examCode: string
  /** ISO date string used for sitemap lastModified + visible "Updated" line. */
  updated: string
  /** Hand-written Q&As appended to the ones derived from the exam blueprint. */
  faqs: Array<{ q: string; a: string }>
  body: string
}

const CONTENT_DIR = path.join(process.cwd(), "content", "exams")

function parseFaqs(value: unknown): Array<{ q: string; a: string }> {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (entry): entry is { q: unknown; a: unknown } =>
        typeof entry === "object" && entry !== null && "q" in entry && "a" in entry,
    )
    .map((entry) => ({ q: String(entry.q), a: String(entry.a) }))
}

function parseFile(filePath: string): ExamHubDoc {
  const raw = fs.readFileSync(filePath, "utf8")
  const { data, content } = matter(raw)
  return {
    slug: String(data.slug),
    title: String(data.title),
    description: String(data.description),
    examCode: String(data.examCode),
    updated: String(data.updated),
    faqs: parseFaqs(data.faqs),
    body: content.trim(),
  }
}

export function getAllExamHubs(): ExamHubDoc[] {
  if (!fs.existsSync(CONTENT_DIR)) return []
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => parseFile(path.join(CONTENT_DIR, file)))
    .sort((a, b) => a.title.localeCompare(b.title))
}

export function getExamHubBySlug(slug: string): ExamHubDoc | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return null
  return parseFile(filePath)
}
