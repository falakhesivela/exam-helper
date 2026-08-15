import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { LEGAL_THEME, MONO, SERIF } from "@/app/(legal)/legal-theme"
import { SITE_AUTHOR } from "@/lib/config/site"
import type { ExamProvider } from "@/lib/exams/types"

const { ink, muted, faint, accent, rule } = LEGAL_THEME

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
      style={{ fontFamily: MONO, fontSize: "10.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: faint, marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "8px" }}
    >
      {items.map((item, i) => (
        <span key={item.label} style={{ display: "flex", gap: "8px" }}>
          {i > 0 && <span aria-hidden>/</span>}
          {item.href ? (
            <Link href={item.href} style={{ color: faint }}>
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

/**
 * Page title set as an editorial headpiece: the kicker rides above the title on
 * a heavy rule, matching the landing page's section folios.
 */
export function PageHeading({
  title,
  kicker,
}: {
  title: string
  kicker?: string
}) {
  return (
    <header style={{ marginBottom: "30px" }}>
      {kicker ? (
        <p style={{ fontFamily: MONO, fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: accent, fontWeight: 500, margin: "0 0 14px", paddingTop: "12px", borderTop: `2px solid ${ink}` }}>
          {kicker}
        </p>
      ) : null}
      <h1 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(34px,5.4vw,52px)", lineHeight: 1.0, letterSpacing: "-0.032em", color: ink, margin: 0, textWrap: "balance" }}>
        {title}
      </h1>
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
    <aside style={{ marginTop: "44px", paddingTop: "22px", borderTop: `1px solid ${rule}`, display: "flex", gap: "14px" }}>
      <div
        aria-hidden
        style={{ flex: "0 0 auto", width: "44px", height: "44px", borderRadius: "2px", background: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: "20px", fontWeight: 400 }}
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
    <aside style={{ marginTop: "48px", borderTop: `2px solid ${ink}`, paddingTop: "24px" }}>
      <p style={{ fontFamily: MONO, fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: accent, fontWeight: 500, margin: "0 0 12px" }}>
        Start free
      </p>
      <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(26px,3.4vw,32px)", lineHeight: 1.08, letterSpacing: "-0.028em", color: ink, margin: "0 0 10px", textWrap: "balance" }}>
        Practise {examName ? `for the ${examName}` : "with Prepa"} — free
      </h2>
      <p style={{ fontSize: "15.5px", lineHeight: 1.65, color: LEGAL_THEME.body, margin: "0 0 18px", maxWidth: "56ch" }}>
        Prepa generates exam-style questions tuned to the official blueprint —
        then blind-answers every multiple-choice question with a second,
        independent model and throws it out if the two disagree. Every
        explanation links to the vendor&apos;s own documentation. 30 free
        questions to start.
      </p>
      <Link
        href="/signup"
        style={{ display: "inline-block", background: accent, color: "#fff", fontWeight: 600, fontSize: "15px", padding: "14px 24px", borderRadius: "2px", border: `1px solid ${accent}` }}
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
