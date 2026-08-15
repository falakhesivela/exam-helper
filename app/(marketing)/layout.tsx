import Link from "next/link"
import { Newsreader, Public_Sans, Spline_Sans_Mono } from "next/font/google"
import { Logo } from "@/components/layout/logo"
import { LEGAL_THEME, MONO, SERIF } from "@/app/(legal)/legal-theme"
import { SITE_DESCRIPTION, SITE_NAME, getSiteUrl } from "@/lib/config/site"
import { JsonLd } from "./marketing-ui"

const serif = Newsreader({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"], variable: "--lp-serif" })
const sans = Public_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--lp-sans" })
const mono = Spline_Sans_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--lp-mono" })

const { paper, ink, body, muted, faint, accent, rule, hair } = LEGAL_THEME

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

        /* Masthead — matches the landing page's editorial shell. */
        .mkt-rule-accent { height:3px; background:${accent}; }
        .mkt-mast { border-bottom:1px solid ${ink}; }
        .mkt-mast-inner { max-width:1240px; margin:0 auto; width:100%; padding:14px 24px;
          display:flex; align-items:center; justify-content:space-between; gap:20px; }
        .mkt-wordmark { display:flex; align-items:center; gap:10px; }
        .mkt-wordmark span { font-family:${SERIF}; font-size:23px; font-weight:500;
          letter-spacing:.02em; line-height:1; color:${ink}; }
        .mkt-mast nav { display:flex; align-items:center; gap:24px; }
        .mkt-mast nav a { font-family:${MONO}; font-size:11px; letter-spacing:.14em;
          text-transform:uppercase; color:${body}; }
        .mkt-mast nav a:hover { color:${accent}; }
        .mkt-mast-cta { color:#fff !important; background:${ink}; padding:9px 15px; border-radius:2px; }
        .mkt-mast-cta:hover { background:${accent}; }
        @media (max-width:560px){ .mkt-mast nav .mkt-nav-link { display:none; } }

        /* Colophon */
        .mkt-colo { border-top:1px solid ${rule}; }
        .mkt-colo-inner { max-width:1240px; margin:0 auto; width:100%; padding:26px 24px;
          display:flex; flex-wrap:wrap; align-items:center; gap:10px 24px;
          font-family:${MONO}; font-size:10.5px; letter-spacing:.12em; text-transform:uppercase; color:${faint}; }
        .mkt-colo-inner a { color:${faint}; }
        .mkt-colo-inner a:hover { color:${accent}; }

        .mkt-prose { font-size:16px; line-height:1.75; color:${body}; }
        .mkt-prose p { margin:0 0 16px; }
        .mkt-prose h2 { font-family:${SERIF}; font-weight:400; font-size:clamp(24px,3vw,30px); line-height:1.12; letter-spacing:-0.025em; color:${ink}; margin:44px 0 14px; padding-top:16px; border-top:1px solid ${rule}; }
        .mkt-prose h3 { font-family:${SERIF}; font-size:21px; font-weight:400; letter-spacing:-0.018em; color:${ink}; margin:30px 0 10px; }
        .mkt-prose ul, .mkt-prose ol { margin:0 0 16px; padding-left:22px; }
        .mkt-prose li { margin-bottom:6px; }
        .mkt-prose li::marker { color:${muted}; }
        .mkt-prose a { color:${accent}; text-decoration:underline; text-underline-offset:3px; }
        .mkt-prose strong { color:${ink}; font-weight:600; }
        .mkt-prose code { font-family:${MONO}; font-size:0.88em; background:#EAE4D6; border-radius:4px; padding:1px 5px; }
        .mkt-prose pre { background:#EAE4D6; border-radius:8px; padding:14px 16px; overflow-x:auto; margin:0 0 16px; }
        .mkt-prose pre code { background:transparent; padding:0; }
        .mkt-prose blockquote { border-left:2px solid ${accent}; margin:0 0 16px; padding:2px 0 2px 16px; color:${muted}; font-style:italic; }
        .mkt-prose hr { border:0; border-top:1px solid ${rule}; margin:28px 0; }
        .mkt-prose table { width:100%; border-collapse:collapse; margin:0 0 16px; font-size:14.5px; }
        .mkt-prose th { font-family:${MONO}; font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:${ink}; text-align:left; padding:0 12px 10px 0; border-bottom:2px solid ${ink}; }
        .mkt-prose td { padding:11px 12px 11px 0; border-bottom:1px solid ${hair}; vertical-align:top; }
        .mkt-link { color:${accent}; text-decoration:underline; text-underline-offset:3px; }
      `}</style>

      <div className="mkt-rule-accent" />
      <header className="mkt-mast">
        <div className="mkt-mast-inner">
          <Link href="/" className="mkt-wordmark" aria-label="Back to Prepa">
            <Logo showWordmark={false} />
            <span>Prepa</span>
          </Link>
          <nav>
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="mkt-nav-link">
                {link.label}
              </Link>
            ))}
            <Link href="/login" className="mkt-nav-link">
              Sign in
            </Link>
            <Link href="/signup" className="mkt-mast-cta">
              Start free
            </Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: "760px", margin: "0 auto", width: "100%", flex: 1, padding: "52px 24px 76px" }}>
        {children}
      </main>

      <footer className="mkt-colo">
        <div className="mkt-colo-inner">
          <span>© {new Date().getFullYear()} Prepa</span>
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
