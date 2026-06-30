import { LEGAL } from "./legal-config"
import { LEGAL_THEME, SERIF, MONO } from "./legal-theme"

const { ink, muted, accent } = LEGAL_THEME

/** Consistent heading + "last updated" line for each legal document. */
export function LegalHeading({ title }: { title: string }) {
  return (
    <header style={{ marginBottom: "32px" }}>
      <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(32px,4.5vw,44px)", lineHeight: 1.08, letterSpacing: "-0.02em", color: ink, margin: "0 0 10px" }}>
        {title}
      </h1>
      <p style={{ fontFamily: MONO, fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase", color: muted, margin: 0 }}>
        Last updated {LEGAL.lastUpdated}
      </p>
    </header>
  )
}

/** Section heading used inside legal documents. */
export function LegalSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section style={{ marginTop: "28px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 600, letterSpacing: "-0.01em", color: ink, margin: "0 0 10px" }}>
        {title}
      </h2>
      {children}
    </section>
  )
}
