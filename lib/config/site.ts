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

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (raw) return raw.replace(/\/+$/, "")
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}
