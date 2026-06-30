import { LEGAL } from "./legal-config"

/** Consistent heading + "last updated" line for each legal document. */
export function LegalHeading({ title }: { title: string }) {
  return (
    <header className="mb-8 space-y-1">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground">
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
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {children}
    </section>
  )
}
