/**
 * Central SEO / site identity config, shared by layout metadata, robots,
 * sitemap, Open Graph image, and JSON-LD structured data.
 *
 * Set NEXT_PUBLIC_APP_URL in production so canonical URLs, the sitemap, and
 * social cards point at the real domain.
 */
export const SITE_NAME = "Prepa"

export const SITE_TITLE = "Prepa — AI Exam Prep for Certification Exams"

export const SITE_DESCRIPTION =
  "Pass AWS, Azure, Google Cloud, CompTIA, Cisco, and CISSP exams with AI lessons, fresh practice questions, hands-on cloud labs, timed mock exams, and a readiness score that tells you when you're ready. Start free."

export const SITE_KEYWORDS = [
  "certification exam practice",
  "AI practice questions",
  "exam prep app",
  "AWS certification practice questions",
  "CompTIA Security+ practice test",
  "Azure certification prep",
  "CISSP practice questions",
  "CCNA practice test",
  "hands-on cloud labs",
  "mock exam simulator",
  "spaced repetition flashcards",
  "adaptive learning",
]

/**
 * The named human behind the guides and posts. Search engines weigh authored,
 * attributable content more heavily than anonymous publisher content, so the
 * byline, the /about page, and the Person JSON-LD all resolve to this one entity.
 *
 * `credentials` and `bio` are shown verbatim on /about — keep them true.
 */
export const SITE_AUTHOR = {
  name: "Falakhe Sivela",
  /** Shown under the byline and on /about. */
  role: "Founder, Prepa",
  bio: "Falakhe Sivela is the founder of Prepa and writes its certification study guides. He builds the exam blueprints, question generators, and study plans behind the app.",
  /** Public profiles used as `sameAs` so the byline resolves to a real identity. */
  sameAs: [] as string[],
} as const

export function authorUrl(): string {
  return `${getSiteUrl()}/about`
}

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (raw) return raw.replace(/\/+$/, "")
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}
