// Single source of truth for the legal pages (Terms, Privacy, Refund).
//
// ⚠️ Fill these in with your real details before submitting the domain to
// Paddle for approval. Paddle's reviewers check that these match your
// registered business and that the pages are reachable on the live domain.
export const LEGAL = {
  appName: "Prepa",
  // Your registered legal entity (same entity as Replai).
  companyName: "Replai (Pty) Ltd", // TODO: confirm exact registered name
  // A monitored support/legal contact address.
  contactEmail: "support@prepa.co.za", // TODO: confirm contact email
  // The public domain you submitted to Paddle (no https://, no www).
  domain: "prepa.co.za",
  // Jurisdiction whose law governs the agreement.
  governingLaw: "the Republic of South Africa",
  // Shown on each page; update when you revise the documents.
  lastUpdated: "30 June 2026",
} as const

export const LEGAL_LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Notice" },
  { href: "/refund", label: "Refund Policy" },
] as const
