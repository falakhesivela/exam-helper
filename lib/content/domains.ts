import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import { EXAM_PRESET_CODES, getExamBlueprint } from "@/lib/exams/registry"
import type { ExamBlueprint, ExamBlueprintDomain } from "@/lib/exams/types"
import { slugForExamCode } from "./exam-slugs"

const CONTENT_DIR = path.join(process.cwd(), "content", "domains")

/** URL-safe slug from a domain's display name — descriptive, unlike the internal ids. */
export function domainSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export interface DomainPage {
  examSlug: string
  examCode: string
  /** Full exam name, e.g. "AWS Certified Solutions Architect – Associate". */
  exam: string
  domain: ExamBlueprintDomain
  slug: string
  /** Weight rank, 1 = heaviest domain on the exam. */
  rank: number
  domainCount: number
  /** Approximate scored questions this domain is worth. */
  approxQuestions: number
  /** Hand-written depth. Pages without it are not indexed — see `hasNotes`. */
  notes: string | null
  /** Optional frontmatter override for the meta description. */
  notesDescription: string | null
}

function readNotes(
  examSlug: string,
  slug: string,
): { body: string; description: string | null } | null {
  const filePath = path.join(CONTENT_DIR, examSlug, `${slug}.md`)
  if (!fs.existsSync(filePath)) return null
  const { data, content } = matter(fs.readFileSync(filePath, "utf8"))
  const body = content.trim()
  if (!body) return null
  return {
    body,
    description: data.description ? String(data.description) : null,
  }
}

function buildPages(blueprint: ExamBlueprint): DomainPage[] {
  const examSlug = slugForExamCode(blueprint.examCode)
  if (!examSlug) return []

  const byWeight = [...blueprint.domains].sort(
    (a, b) => b.weightPercent - a.weightPercent,
  )

  return blueprint.domains.map((domain) => {
    const slug = domainSlug(domain.name)
    const notes = readNotes(examSlug, slug)
    return {
      examSlug,
      examCode: blueprint.examCode,
      exam: blueprint.exam,
      domain,
      slug,
      rank: byWeight.findIndex((d) => d.id === domain.id) + 1,
      domainCount: blueprint.domains.length,
      approxQuestions: Math.round(
        (domain.weightPercent / 100) * blueprint.questionCount,
      ),
      notes: notes?.body ?? null,
      notesDescription: notes?.description ?? null,
    }
  })
}

export function getAllDomainPages(): DomainPage[] {
  return EXAM_PRESET_CODES.flatMap((code) => {
    const blueprint = getExamBlueprint(code)
    return blueprint ? buildPages(blueprint) : []
  })
}

/** Domain pages for one exam, in the blueprint's own order. */
export function getDomainPagesForExam(examSlug: string): DomainPage[] {
  return getAllDomainPages().filter((page) => page.examSlug === examSlug)
}

export function getDomainPage(
  examSlug: string,
  slug: string,
): DomainPage | null {
  return (
    getAllDomainPages().find(
      (page) => page.examSlug === examSlug && page.slug === slug,
    ) ?? null
  )
}

/**
 * Only pages carrying hand-written notes are worth submitting to a search
 * engine. A page built from blueprint data alone is templated and near-empty,
 * which is precisely the thin-content pattern crawlers demote — so those pages
 * render (the exam guide links to them) but are noindexed and kept out of the
 * sitemap until someone writes the content.
 */
export function hasNotes(page: DomainPage): boolean {
  return page.notes !== null
}

export function getIndexableDomainPages(): DomainPage[] {
  return getAllDomainPages().filter(hasNotes)
}
