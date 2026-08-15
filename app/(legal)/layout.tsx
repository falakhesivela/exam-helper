import Link from "next/link"
import { Newsreader, Public_Sans, Spline_Sans_Mono } from "next/font/google"
import { Logo } from "@/components/layout/logo"
import { LEGAL_LINKS } from "./legal-config"
import { LEGAL_THEME, MONO } from "./legal-theme"

const serif = Newsreader({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"], variable: "--lp-serif" })
const sans = Public_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--lp-sans" })
const mono = Spline_Sans_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--lp-mono" })

const { paper, ink, body, muted, accent, border } = LEGAL_THEME

/** Shared shell for the public legal pages (Terms, Privacy, Refund). */
export default function LegalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`legal ${serif.variable} ${sans.variable} ${mono.variable}`}
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
      <style>{`
        .legal ::selection { background:${accent}; color:#fff; }
        .legal a { text-decoration:none; }
        .legal-doc { font-size:15px; line-height:1.72; color:${body}; }
        .legal-doc p { margin:0; }
        .legal-link { color:${accent}; text-decoration:underline; text-underline-offset:3px; }
        .legal-wordmark { display:flex; align-items:center; gap:10px; }
        .legal-wordmark span { font-family:var(--lp-serif),'Newsreader',serif; font-size:23px;
          font-weight:500; letter-spacing:.02em; line-height:1; color:${ink}; }
      `}</style>

      <div style={{ height: "3px", background: accent }} />
      <header style={{ borderBottom: `1px solid ${ink}` }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", width: "100%", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" className="legal-wordmark" aria-label="Back to Prepa">
            <Logo showWordmark={false} />
            <span>Prepa</span>
          </Link>
          <Link href="/login" style={{ fontFamily: MONO, fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: muted }}>
            Sign in
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: "720px", margin: "0 auto", width: "100%", flex: 1, padding: "56px 24px" }}>
        {children}
      </main>

      <footer style={{ borderTop: `1px solid ${border}` }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", width: "100%", padding: "26px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 24px", fontFamily: MONO, fontSize: "10.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: muted }}>
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} style={{ color: muted }}>
              {link.label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
