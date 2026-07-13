import Link from "next/link"
import { Newsreader, Public_Sans, Spline_Sans_Mono } from "next/font/google"
import { Logo } from "@/components/layout/logo"
import { LEGAL_THEME, MONO, SERIF } from "@/app/(legal)/legal-theme"
import { SITE_DESCRIPTION, SITE_NAME, getSiteUrl } from "@/lib/config/site"
import { JsonLd } from "./marketing-ui"

const serif = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--lp-serif" })
const sans = Public_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--lp-sans" })
const mono = Spline_Sans_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--lp-mono" })

const { paper, ink, body, muted, accent, border } = LEGAL_THEME

const NAV_LINKS = [
  { href: "/exams", label: "Exams" },
  { href: "/blog", label: "Blog" },
] as const

const FOOTER_LINKS = [
  { href: "/exams", label: "Exam Guides" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refund", label: "Refund" },
] as const

/** Publisher identity, so every guide and post ties back to one entity. */
function siteJsonLd() {
  const siteUrl = getSiteUrl()
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: SITE_NAME,
    url: siteUrl,
    description: SITE_DESCRIPTION,
    logo: `${siteUrl}/icons/icon-512.png`,
  }
  return [
    organization,
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: SITE_NAME,
      url: siteUrl,
      inLanguage: "en",
      publisher: { "@id": `${siteUrl}/#organization` },
    },
  ]
}

/** Shared shell for the public SEO pages (/exams, /blog). */
export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`mkt ${serif.variable} ${sans.variable} ${mono.variable}`}
      style={{
        background: paper,
        color: ink,
        colorScheme: "light",
        fontFamily: "var(--lp-sans), system-ui, sans-serif",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <JsonLd data={siteJsonLd()} />
      <style>{`
        .mkt ::selection { background:${accent}; color:#fff; }
        .mkt a { text-decoration:none; }
        .mkt-prose { font-size:16px; line-height:1.75; color:${body}; }
        .mkt-prose p { margin:0 0 16px; }
        .mkt-prose h2 { font-family:${SERIF}; font-weight:500; font-size:clamp(22px,3vw,27px); line-height:1.2; letter-spacing:-0.015em; color:${ink}; margin:36px 0 12px; }
        .mkt-prose h3 { font-size:18px; font-weight:600; letter-spacing:-0.01em; color:${ink}; margin:28px 0 10px; }
        .mkt-prose ul, .mkt-prose ol { margin:0 0 16px; padding-left:22px; }
        .mkt-prose li { margin-bottom:6px; }
        .mkt-prose li::marker { color:${muted}; }
        .mkt-prose a { color:${accent}; text-decoration:underline; text-underline-offset:3px; }
        .mkt-prose strong { color:${ink}; font-weight:600; }
        .mkt-prose code { font-family:${MONO}; font-size:0.88em; background:#EAE4D6; border-radius:4px; padding:1px 5px; }
        .mkt-prose pre { background:#EAE4D6; border-radius:8px; padding:14px 16px; overflow-x:auto; margin:0 0 16px; }
        .mkt-prose pre code { background:transparent; padding:0; }
        .mkt-prose blockquote { border-left:2px solid ${accent}; margin:0 0 16px; padding:2px 0 2px 16px; color:${muted}; font-style:italic; }
        .mkt-prose hr { border:0; border-top:1px solid ${border}; margin:28px 0; }
        .mkt-prose table { width:100%; border-collapse:collapse; margin:0 0 16px; font-size:14.5px; }
        .mkt-prose th { font-family:${MONO}; font-size:12px; letter-spacing:0.06em; text-transform:uppercase; color:${muted}; text-align:left; padding:8px 12px 8px 0; border-bottom:1px solid ${border}; }
        .mkt-prose td { padding:9px 12px 9px 0; border-bottom:1px solid ${border}; vertical-align:top; }
        .mkt-link { color:${accent}; text-decoration:underline; text-underline-offset:3px; }
      `}</style>

      <header style={{ borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", width: "100%", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <Link href="/" aria-label="Back to Prepa">
            <Logo />
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: "22px", fontSize: "14px", fontWeight: 500 }}>
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} style={{ color: body }}>
                {link.label}
              </Link>
            ))}
            <Link href="/login" style={{ color: muted }}>
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: "760px", margin: "0 auto", width: "100%", flex: 1, padding: "48px 24px 72px" }}>
        {children}
      </main>

      <footer style={{ borderTop: `1px solid ${border}` }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", width: "100%", padding: "24px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 22px", fontFamily: MONO, fontSize: "12px", letterSpacing: "0.04em", color: muted }}>
          <span>© {new Date().getFullYear()} Prepa</span>
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} style={{ color: muted }}>
              {link.label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
