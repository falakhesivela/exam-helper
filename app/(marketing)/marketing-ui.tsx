import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { LEGAL_THEME, MONO, SERIF } from "@/app/(legal)/legal-theme"
import { SITE_AUTHOR } from "@/lib/config/site"
import type { ExamProvider } from "@/lib/exams/types"

const { ink, muted, accent, border } = LEGAL_THEME

export const PROVIDER_NAMES: Record<ExamProvider, string> = {
  aws: "AWS",
  azure: "Microsoft Azure",
  gcp: "Google Cloud",
  comptia: "CompTIA",
  cisco: "Cisco",
  isc2: "ISC2",
  custom: "Custom",
}

/** Long-form Markdown body rendered server-side with real h2/h3 tags for SEO. */
export function MarketingProse({ children }: { children: string }) {
  return (
    <div className="mkt-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}

export function Breadcrumb({
  items,
}: {
  items: Array<{ href?: string; label: string }>
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{ fontFamily: MONO, fontSize: "12px", letterSpacing: "0.06em", textTransform: "uppercase", color: muted, marginBottom: "18px", display: "flex", flexWrap: "wrap", gap: "8px" }}
    >
      {items.map((item, i) => (
        <span key={item.label} style={{ display: "flex", gap: "8px" }}>
          {i > 0 && <span aria-hidden>/</span>}
          {item.href ? (
            <Link href={item.href} style={{ color: muted }}>
              {item.label}
            </Link>
          ) : (
            <span style={{ color: ink }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

export function PageHeading({
  title,
  kicker,
}: {
  title: string
  kicker?: string
}) {
  return (
    <header style={{ marginBottom: "28px" }}>
      <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(30px,4.5vw,42px)", lineHeight: 1.1, letterSpacing: "-0.02em", color: ink, margin: "0 0 10px" }}>
        {title}
      </h1>
      {kicker ? (
        <p style={{ fontFamily: MONO, fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase", color: muted, margin: 0 }}>
          {kicker}
        </p>
      ) : null}
    </header>
  )
}

/**
 * Visible byline. Search engines only credit an author they can see on the
 * page, so this must render alongside the Person JSON-LD, never instead of it.
 */
export function Byline({ date }: { date?: string }) {
  return (
    <p style={{ fontSize: "14px", color: muted, margin: "0 0 24px" }}>
      By{" "}
      <Link href="/about" rel="author" style={{ color: accent, textDecoration: "underline", textUnderlineOffset: "3px" }}>
        {SITE_AUTHOR.name}
      </Link>
      {date ? ` · ${date}` : null}
    </p>
  )
}

/** Author card closing out each guide and post, linking to the author entity page. */
export function AuthorCard() {
  return (
    <aside style={{ marginTop: "40px", paddingTop: "24px", borderTop: `1px solid ${border}`, display: "flex", gap: "14px" }}>
      <div
        aria-hidden
        style={{ flex: "0 0 auto", width: "44px", height: "44px", borderRadius: "50%", background: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: "19px", fontWeight: 600 }}
      >
        {SITE_AUTHOR.name.charAt(0)}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: ink }}>
          {SITE_AUTHOR.name}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: "14px", lineHeight: 1.6, color: LEGAL_THEME.body }}>
          {SITE_AUTHOR.bio}{" "}
          <Link href="/about" className="mkt-link">
            More about the author
          </Link>
          .
        </p>
      </div>
    </aside>
  )
}

/** Signup call-to-action shown at the bottom of hubs and posts. */
export function CtaPanel({ examName }: { examName?: string }) {
  return (
    <aside style={{ marginTop: "44px", borderTop: `1px solid ${border}`, paddingTop: "28px" }}>
      <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "24px", letterSpacing: "-0.015em", color: ink, margin: "0 0 8px" }}>
        Practise {examName ? `for the ${examName}` : "with Prepa"} — free
      </h2>
      <p style={{ fontSize: "15.5px", lineHeight: 1.65, color: LEGAL_THEME.body, margin: "0 0 18px", maxWidth: "56ch" }}>
        Prepa generates fresh, exam-style questions tuned to the official
        blueprint, explains every answer, and tracks a readiness score that
        tells you when you&apos;re ready to book. 10 free questions every day.
      </p>
      <Link
        href="/signup"
        style={{ display: "inline-block", background: accent, color: "#fff", fontWeight: 600, fontSize: "15px", padding: "12px 22px", borderRadius: "10px" }}
      >
        Start practising free
      </Link>
    </aside>
  )
}

/** Renders a JSON-LD structured-data script tag. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
