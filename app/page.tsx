import Link from "next/link"
import { Newsreader, Public_Sans, Spline_Sans_Mono } from "next/font/google"
import { Logo } from "@/components/layout/logo"

// Fonts from the imported Prepa Landing design.
const serif = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--lp-serif",
})
const sans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--lp-sans",
})
const mono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--lp-mono",
})

const ACCENT = "#1E5C44"
const PAPER = "#F3EFE7"
const INK = "#1A1C18"
const SERIF = "var(--lp-serif), 'Newsreader', serif"
const MONO = "var(--lp-mono), 'Spline Sans Mono', monospace"

const kicker: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: "12px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: ACCENT,
  fontWeight: 500,
}
const check: React.CSSProperties = { color: ACCENT, fontWeight: 700 }
const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #EAE3D6",
  borderRadius: "16px",
}

const features = [
  { k: "Fresh", h: "AI questions, every session", p: "New, exam-style multiple-choice questions tuned to your weak areas — never the same drill twice." },
  { k: "Instant", h: "Explanations the moment you answer", p: "Learn from every mistake instead of just seeing a score — clear reasoning on every question." },
  { k: "Progress", h: "Mastery & streaks you can see", p: "Track mastery by topic, build a daily streak, and watch your readiness climb toward exam day." },
  { k: "Mock", h: "Full mock exams, timed", p: "Practise under realistic timed conditions that mirror the real certification format." },
]

const coverage = ["AWS Certified", "CompTIA Security+", "Azure", "PMP", "CFA", "CISSP", "ITIL 4"]

const steps = [
  { n: "01", h: "Pick your exam", p: "Tell Prepa what you're studying for. No setup, no question banks to import." },
  { n: "02", h: "Practise & learn", p: "Answer adaptive questions, read instant explanations, and build a streak." },
  { n: "03", h: "Sit a mock", p: "When you're close, run a full timed mock that mirrors exam day." },
]

const freeFeatures = ["20 practice questions per day", "AI questions & explanations", "Progress tracking & streaks", "Save progress across devices"]
const proFeatures = ["Unlimited practice questions", "Full mock exams, any length", "Priority AI generation", "Everything in Free"]

export default function LandingPage() {
  return (
    <div
      className={`lp ${serif.variable} ${sans.variable} ${mono.variable}`}
      style={{
        background: PAPER,
        color: INK,
        colorScheme: "light",
        fontFamily: "var(--lp-sans), system-ui, sans-serif",
        minHeight: "100vh",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <style>{`
        .lp ::selection { background:${ACCENT}; color:#fff; }
        .lp a { text-decoration:none; }
        @media (max-width:860px){
          .lp-hero, .lp-features, .lp-how, .lp-pricing { grid-template-columns:1fr !important; }
          .lp-hero { gap:40px !important; }
        }
      `}</style>

      {/* NAV */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: `color-mix(in oklab, ${PAPER} 86%, transparent)`, backdropFilter: "blur(12px)", borderBottom: "1px solid #E3DCCE" }}>
        <nav style={{ maxWidth: "1180px", margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" aria-label="Prepa home">
            <Logo />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <Link href="/login" style={{ color: "#3D403A", fontWeight: 500, fontSize: "15px" }}>Sign in</Link>
            <Link href="/dashboard" style={{ background: ACCENT, color: "#fff", fontWeight: 600, fontSize: "15px", padding: "10px 18px", borderRadius: "10px", boxShadow: "0 1px 2px rgba(20,30,20,0.15)" }}>Start free</Link>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="lp-hero" style={{ maxWidth: "1180px", margin: "0 auto", padding: "72px 24px 40px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: "56px", alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: MONO, fontSize: "12px", letterSpacing: "0.16em", textTransform: "uppercase", color: ACCENT, fontWeight: 500, marginBottom: "22px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: ACCENT }} />AI-powered exam prep
          </div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(40px,5vw,60px)", lineHeight: 1.04, letterSpacing: "-0.02em", margin: "0 0 22px" }}>
            Pass your certification exam with practice that <em style={{ fontStyle: "italic", color: ACCENT }}>adapts to you</em>
          </h1>
          <p style={{ fontSize: "18px", lineHeight: 1.62, color: "#54564E", maxWidth: "46ch", margin: "0 0 30px" }}>
            Prepa generates fresh, exam-style questions with instant explanations, mock exams, and progress tracking. Start practising in seconds — no sign-up required.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "22px" }}>
            <Link href="/dashboard" style={{ background: ACCENT, color: "#fff", fontWeight: 600, fontSize: "16px", padding: "15px 26px", borderRadius: "11px", boxShadow: `0 8px 20px -8px color-mix(in oklab, ${ACCENT} 60%, transparent)` }}>Start practising free</Link>
            <Link href="/upgrade" style={{ background: "#fff", color: INK, fontWeight: 600, fontSize: "16px", padding: "15px 26px", borderRadius: "11px", border: "1px solid #DCD5C7" }}>See pricing</Link>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 18px", fontSize: "14px", color: "#6B6D64" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "7px" }}><span style={check}>✓</span>20 free questions daily</span>
            <span style={{ color: "#CFC8BA" }}>·</span>
            <span style={{ display: "flex", alignItems: "center", gap: "7px" }}><span style={check}>✓</span>No account needed</span>
            <span style={{ color: "#CFC8BA" }}>·</span>
            <span style={{ display: "flex", alignItems: "center", gap: "7px" }}><span style={check}>✓</span>Cancel anytime</span>
          </div>
        </div>

        {/* PRODUCT MOCK */}
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: "-10px -10px auto auto", width: "140px", height: "140px", background: `radial-gradient(circle at 70% 30%, color-mix(in oklab, ${ACCENT} 22%, transparent), transparent 70%)`, filter: "blur(8px)", zIndex: 0 }} />
          <div style={{ position: "relative", zIndex: 1, background: "#fff", border: "1px solid #EAE3D6", borderRadius: "20px", boxShadow: "0 40px 70px -34px rgba(28,30,22,0.32), 0 2px 8px rgba(0,0,0,0.04)", padding: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <span style={{ fontFamily: MONO, fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, background: `color-mix(in oklab, ${ACCENT} 10%, #fff)`, padding: "5px 10px", borderRadius: "7px" }}>AWS · Databases</span>
              <span style={{ fontFamily: MONO, fontSize: "11px", letterSpacing: "0.04em", color: "#7A7C72", display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width: "6px", height: "6px", borderRadius: "50%", background: ACCENT }} />12-DAY STREAK</span>
            </div>
            <div style={{ height: "6px", borderRadius: "99px", background: "#EEE8DC", marginBottom: "18px", overflow: "hidden" }}><div style={{ width: "68%", height: "100%", background: ACCENT, borderRadius: "99px" }} /></div>
            <div style={{ fontFamily: MONO, fontSize: "11px", color: "#9A9C90", letterSpacing: "0.04em", marginBottom: "8px" }}>QUESTION 14 OF 20</div>
            <p style={{ fontSize: "16.5px", fontWeight: 600, lineHeight: 1.42, margin: "0 0 16px" }}>Which AWS service provides a fully managed NoSQL database with single-digit millisecond latency at any scale?</p>
            <div style={{ display: "grid", gap: "9px", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "11px", padding: "12px 13px", border: "1px solid #E8E2D6", borderRadius: "11px" }}>
                <span style={{ width: "25px", height: "25px", flex: "none", borderRadius: "7px", border: "1px solid #DCD5C7", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: "12px", color: "#7A7C72" }}>A</span>
                <span style={{ fontSize: "14.5px", color: "#3D403A" }}>Amazon RDS</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "11px", padding: "12px 13px", border: `1.5px solid ${ACCENT}`, borderRadius: "11px", background: `color-mix(in oklab, ${ACCENT} 8%, #fff)` }}>
                <span style={{ width: "25px", height: "25px", flex: "none", borderRadius: "7px", background: ACCENT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: "12px", fontWeight: 600 }}>B</span>
                <span style={{ fontSize: "14.5px", color: INK, fontWeight: 600 }}>Amazon DynamoDB</span>
                <span style={{ marginLeft: "auto", color: ACCENT, fontWeight: 700, fontSize: "15px" }}>✓</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "11px", padding: "12px 13px", border: "1px solid #E8E2D6", borderRadius: "11px" }}>
                <span style={{ width: "25px", height: "25px", flex: "none", borderRadius: "7px", border: "1px solid #DCD5C7", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: "12px", color: "#7A7C72" }}>C</span>
                <span style={{ fontSize: "14.5px", color: "#3D403A" }}>Amazon Redshift</span>
              </div>
            </div>
            <div style={{ background: `color-mix(in oklab, ${ACCENT} 7%, #fff)`, borderLeft: `3px solid ${ACCENT}`, borderRadius: "9px", padding: "12px 14px" }}>
              <div style={{ fontFamily: MONO, fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, marginBottom: "5px" }}>Why</div>
              <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.5, color: "#42453E" }}>DynamoDB is AWS&apos;s fully managed NoSQL store, built for consistent single-digit-ms latency at scale. RDS and Aurora are relational; Redshift is for analytics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* EXAM COVERAGE */}
      <section style={{ maxWidth: "1180px", margin: "0 auto", padding: "34px 24px 20px" }}>
        <div style={{ borderTop: "1px solid #E3DCCE", paddingTop: "30px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "18px 26px" }}>
          <span style={{ fontFamily: MONO, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#84867B", fontWeight: 500 }}>Bring any exam —</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "9px" }}>
            {coverage.map((c) => (
              <span key={c} style={{ fontSize: "13.5px", fontWeight: 500, color: "#3D403A", background: "#fff", border: "1px solid #E5DECF", padding: "7px 14px", borderRadius: "99px" }}>{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ maxWidth: "1180px", margin: "0 auto", padding: "64px 24px 30px" }}>
        <div style={{ maxWidth: "640px", marginBottom: "42px" }}>
          <div style={{ ...kicker, marginBottom: "14px" }}>What you get</div>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(30px,3.6vw,42px)", lineHeight: 1.08, letterSpacing: "-0.02em", margin: 0 }}>Everything you need between now and exam day</h2>
        </div>
        <div className="lp-features" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "18px" }}>
          {features.map((f) => (
            <div key={f.k} style={{ ...cardStyle, padding: "26px 26px 28px" }}>
              <div style={{ fontFamily: MONO, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, marginBottom: "14px" }}>{f.k}</div>
              <h3 style={{ fontSize: "19px", fontWeight: 600, margin: "0 0 9px", letterSpacing: "-0.01em" }}>{f.h}</h3>
              <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: "#56584F" }}>{f.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: "1180px", margin: "0 auto", padding: "54px 24px" }}>
        <div style={{ ...cardStyle, borderRadius: "22px", padding: "48px 44px" }}>
          <div className="lp-how" style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: "40px", alignItems: "start" }}>
            <div>
              <div style={{ ...kicker, marginBottom: "14px" }}>How it works</div>
              <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(28px,3.2vw,38px)", lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 0 22px" }}>Start in seconds</h2>
              <Link href="/dashboard" style={{ background: ACCENT, color: "#fff", fontWeight: 600, fontSize: "15px", padding: "13px 22px", borderRadius: "11px", display: "inline-block" }}>Start practising free</Link>
            </div>
            <div style={{ display: "grid", gap: "6px" }}>
              {steps.map((s, i) => (
                <div key={s.n} style={{ display: "flex", gap: "18px", padding: "18px 0", borderBottom: i < steps.length - 1 ? "1px solid #EFE9DD" : undefined }}>
                  <span style={{ fontFamily: SERIF, fontSize: "24px", color: ACCENT, fontWeight: 500, minWidth: "38px" }}>{s.n}</span>
                  <div>
                    <h3 style={{ fontSize: "17px", fontWeight: 600, margin: "0 0 5px" }}>{s.h}</h3>
                    <p style={{ margin: 0, fontSize: "14.5px", lineHeight: 1.55, color: "#56584F" }}>{s.p}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ maxWidth: "1180px", margin: "0 auto", padding: "40px 24px 60px" }}>
        <div style={{ textAlign: "center", maxWidth: "560px", margin: "0 auto 40px" }}>
          <div style={{ ...kicker, marginBottom: "14px" }}>Pricing</div>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(30px,3.6vw,42px)", lineHeight: 1.08, letterSpacing: "-0.02em", margin: "0 0 12px" }}>Start free. Go unlimited when you&apos;re serious.</h2>
          <p style={{ fontSize: "16px", color: "#56584F", margin: 0 }}>Cancel anytime. No surprises.</p>
        </div>
        <div className="lp-pricing" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", maxWidth: "820px", margin: "0 auto" }}>
          {/* Free */}
          <div style={{ ...cardStyle, borderRadius: "18px", padding: "32px" }}>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#3D403A", marginBottom: "12px" }}>Free</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "6px" }}><span style={{ fontFamily: SERIF, fontSize: "46px", fontWeight: 500 }}>R0</span><span style={{ fontSize: "15px", color: "#7A7C72" }}>/forever</span></div>
            <p style={{ fontSize: "14.5px", color: "#56584F", margin: "0 0 22px" }}>Start practising right away — no account needed.</p>
            <div style={{ display: "grid", gap: "11px", marginBottom: "26px" }}>
              {freeFeatures.map((f) => (
                <div key={f} style={{ display: "flex", gap: "10px", fontSize: "14.5px", color: "#3D403A" }}><span style={check}>✓</span>{f}</div>
              ))}
            </div>
            <Link href="/dashboard" style={{ display: "block", textAlign: "center", background: "#F4F0E8", color: INK, fontWeight: 600, fontSize: "15px", padding: "13px", borderRadius: "11px", border: "1px solid #E1DACB" }}>Start free</Link>
          </div>
          {/* Pro */}
          <div style={{ background: "#fff", border: `1.5px solid ${ACCENT}`, borderRadius: "18px", padding: "32px", position: "relative", boxShadow: `0 30px 60px -34px color-mix(in oklab, ${ACCENT} 50%, transparent)` }}>
            <span style={{ position: "absolute", top: "-12px", left: "32px", fontFamily: MONO, fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, color: "#fff", background: ACCENT, padding: "5px 12px", borderRadius: "99px" }}>Most popular</span>
            <div style={{ fontSize: "15px", fontWeight: 600, color: ACCENT, marginBottom: "12px" }}>Pro</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "6px" }}><span style={{ fontFamily: SERIF, fontSize: "46px", fontWeight: 500 }}>R6</span><span style={{ fontSize: "15px", color: "#7A7C72" }}>/month</span></div>
            <p style={{ fontSize: "14.5px", color: "#56584F", margin: "0 0 22px" }}>Unlimited practice for serious exam prep.</p>
            <div style={{ display: "grid", gap: "11px", marginBottom: "26px" }}>
              {proFeatures.map((f) => (
                <div key={f} style={{ display: "flex", gap: "10px", fontSize: "14.5px", color: "#3D403A" }}><span style={check}>✓</span>{f}</div>
              ))}
            </div>
            <Link href="/upgrade" style={{ display: "block", textAlign: "center", background: ACCENT, color: "#fff", fontWeight: 600, fontSize: "15px", padding: "13px", borderRadius: "11px" }}>Upgrade to Pro</Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: "0 24px 64px" }}>
        <div style={{ maxWidth: "1180px", margin: "0 auto", background: ACCENT, borderRadius: "24px", padding: "64px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1), transparent 55%)", pointerEvents: "none" }} />
          <h2 style={{ position: "relative", fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(30px,3.8vw,44px)", lineHeight: 1.06, letterSpacing: "-0.02em", color: "#fff", margin: "0 0 16px" }}>Ready to study smarter?</h2>
          <p style={{ position: "relative", fontSize: "17px", lineHeight: 1.6, color: "rgba(255,255,255,0.86)", maxWidth: "46ch", margin: "0 auto 28px" }}>Jump straight in — no account needed. Sign up later to save your progress across devices.</p>
          <Link href="/dashboard" style={{ position: "relative", display: "inline-block", background: "#fff", color: ACCENT, fontWeight: 700, fontSize: "16px", padding: "16px 30px", borderRadius: "12px", boxShadow: "0 14px 30px -12px rgba(0,0,0,0.35)" }}>Start practising free</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #E3DCCE" }}>
        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "30px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Logo showWordmark={false} />
            <span style={{ fontSize: "14px", color: "#6B6D64" }}>© {new Date().getFullYear()} Prepa</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "22px", fontSize: "14px" }}>
            <Link href="/terms" style={{ color: "#6B6D64" }}>Terms</Link>
            <Link href="/privacy" style={{ color: "#6B6D64" }}>Privacy</Link>
            <Link href="/refund" style={{ color: "#6B6D64" }}>Refund</Link>
            <Link href="/login" style={{ color: "#6B6D64" }}>Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
