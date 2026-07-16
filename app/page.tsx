import Link from "next/link"
import { redirect } from "next/navigation"
import { Newsreader, Public_Sans, Spline_Sans_Mono } from "next/font/google"
import { Logo } from "@/components/layout/logo"
import { LandingProButton } from "@/components/upgrade/landing-pro-button"
import { resolveAuthUser } from "@/lib/supabase/resolve-user"
import { SITE_DESCRIPTION, SITE_NAME, getSiteUrl } from "@/lib/config/site"
import { PLANS, PRO_ANNUAL_PRICE_LABEL, TEAM_PLAN } from "@/lib/config/pricing"

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

const coverage = [
  "AWS Solutions Architect",
  "AWS Cloud Practitioner",
  "AWS Developer",
  "AWS DevOps Professional",
  "CompTIA Security+",
  "CompTIA Network+",
  "CompTIA A+",
  "Cisco CCNA",
  "Azure Fundamentals",
  "Azure Administrator",
  "Google Cloud Engineer",
  "CISSP",
  "+ any custom exam",
]

const features = [
  {
    icon: "book",
    k: "Learn",
    h: "A syllabus that actually teaches",
    p: "Your exam's full syllabus, weighted like the real test, with AI lessons built around decision tables, exam traps, and key facts — then a knowledge check that proves you got it.",
  },
  {
    icon: "sparkles",
    k: "Adaptive",
    h: "Fresh AI questions, every session",
    p: "New exam-style questions generated for you each time, tuned to the topics you keep missing. Never the same recycled drill twice.",
  },
  {
    icon: "flask",
    k: "Hands-on Labs",
    h: "Do it for real, not just on paper",
    p: "Guided labs you run in your own free-tier cloud account — build the VPC, deploy the pipeline — with checkpoints that prove you did it and cleanup steps so you never get billed.",
  },
  {
    icon: "chat",
    k: "AI Tutor",
    h: "Ask why — not just what",
    p: "Every answer and every lesson comes with a built-in AI tutor. Ask follow-ups, get mnemonics, request a simpler explanation — until it actually clicks.",
  },
  {
    icon: "timer",
    k: "Mock Exams",
    h: "Timed mocks with real exam formats",
    p: "Multiple choice, drag-to-order, matching, Yes/No grids — even typed CLI commands for network exams. The exact question styles you'll face, under the real clock.",
  },
  {
    icon: "shield",
    k: "Double-checked",
    h: "Every question verified twice",
    p: "A second, independent AI blind-answers every generated question before you see it. If the two disagree, the question is thrown out — so you never study a wrong answer key.",
  },
  {
    icon: "gauge",
    k: "Readiness",
    h: "Know when you're ready",
    p: "A readiness score that climbs as you improve, plus mastery tracking per exam domain — so exam day is a confirmation, not a gamble.",
  },
  {
    icon: "calendar",
    k: "Study Plan",
    h: "A plan for today, every day",
    p: "Set your exam date and Prepa builds a daily plan around your weak areas, rebalances when life happens, and coaches you on pace.",
  },
  {
    icon: "layers",
    k: "Retention",
    h: "Spaced repetition that runs itself",
    p: "Missed questions and key facts from your lessons automatically become flashcards, scheduled to come back right before you'd forget them.",
  },
]

const steps = [
  {
    n: "01",
    h: "Pick your exam — or upload your notes",
    p: "Choose from 12 major certifications or describe any exam. Thirty seconds later you have a personalized syllabus, weighted like the real test.",
  },
  {
    n: "02",
    h: "Learn it, then do it for real",
    p: "AI lessons teach each topic with decision tables and exam traps — then hands-on labs put you in the actual cloud console, in your own free account.",
  },
  {
    n: "03",
    h: "Drill with questions built for you",
    p: "Adaptive, exam-style practice tuned to your weak spots, with instant explanations and an AI tutor for follow-ups. Misses come back as flashcards.",
  },
  {
    n: "04",
    h: "Sit mocks until readiness says go",
    p: "Full timed simulations in the real exam's format, a readiness score per domain, and a daily plan that paces you to your exam date.",
  },
]

const versus = [
  { old: "The same recycled questions, over and over", nu: "Fresh AI-generated questions every single session" },
  { old: "Reading theory you'll never touch", nu: "Guided hands-on labs in your own cloud account" },
  { old: "An answer key and nothing else", nu: "Lessons, instant explanations, and an AI tutor for follow-ups" },
  { old: "Answer keys you just have to trust", nu: "Every question blind-checked by a second AI before you see it" },
  { old: "No idea if you're actually ready", nu: "A readiness score and mastery tracking per exam domain" },
  { old: "Clunky PDFs chained to your desktop", nu: "Installs on your phone and works offline" },
]

const faqs = [
  {
    q: "Which certification exams does Prepa cover?",
    a: `Prepa works with any certification exam — including ${coverage.slice(0, 7).join(", ")} and hundreds more. Just tell it what you're studying for and it generates fresh, exam-style questions. You can even upload your own PDF study notes and Prepa will build questions from them.`,
  },
  {
    q: "Is Prepa free to use?",
    a: "Yes. The free plan lets you generate AI practice questions, a mock exam, and AI lessons to try everything out. Pro ($12/month, or $79/year) unlocks daily practice, mock exams, hands-on labs, and the AI tutor and coach. Exam Pass ($39 one-time) gives you everything at exam-cram volume — 250 questions and 2 full mock exams every day — for 90 days. Teams get per-seat pricing at $15/seat/month.",
  },
  {
    q: "How is Prepa different from static question banks?",
    a: "Question banks recycle a fixed set of questions and stop there. Prepa covers the whole journey: AI lessons that teach the syllabus, fresh exam-style questions tuned to your weak areas (each one blind-verified by a second AI before you see it), hands-on labs in the real cloud console, spaced-repetition flashcards, and a readiness score that tells you when you're prepared.",
  },
  {
    q: "What are hands-on labs? Do I need a cloud account?",
    a: "Labs are guided, step-by-step exercises you run in your own free-tier AWS, Azure, or Google Cloud account — build a real VPC, deploy a real pipeline. Each lab names only free-tier-eligible resources, ends with checkpoint questions that prove you did the work, and includes a cleanup checklist so nothing keeps running and nothing gets billed.",
  },
  {
    q: "Can I study for more than one exam at once?",
    a: "Yes. Add as many certifications as you like — each gets its own syllabus, lessons, practice history, readiness score, and study plan. Prepa follows whichever exam you practised last, and you can switch views anytime.",
  },
  {
    q: "Can I use my own study material?",
    a: "Yes — upload your PDF notes or course material and Prepa generates practice questions directly from it, alongside its own exam-style questions.",
  },
  {
    q: "Can I use Prepa with a team, class, or bootcamp cohort?",
    a: "Yes — the Team plan is $15 per seat per month. Every member gets full Pro access, and team leads can assign the same mock exam to everyone and compare results, track cohort readiness on a team dashboard with a weekly leaderboard and at-risk flags, export progress as CSV, and get a weekly email digest. One subscription, one invoice, add or remove seats anytime.",
  },
  {
    q: "Does it work on my phone?",
    a: "Prepa is built mobile-first. Install it to your home screen like a native app and keep practising even when your connection drops.",
  },
]

const freePlan = PLANS.find((p) => p.tier === "free")!
const proPlan = PLANS.find((p) => p.tier === "pro")!
const examPassPlan = PLANS.find((p) => p.tier === "exam_pass")!

function buildStructuredData() {
  const siteUrl = getSiteUrl()
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: siteUrl,
      description: SITE_DESCRIPTION,
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      url: siteUrl,
      description: SITE_DESCRIPTION,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: "USD",
          description: freePlan.tagline,
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: "12",
          priceCurrency: "USD",
          description: proPlan.tagline,
        },
        {
          "@type": "Offer",
          name: "Exam Pass",
          price: "39",
          priceCurrency: "USD",
          description: examPassPlan.tagline,
        },
        {
          "@type": "Offer",
          name: "Team",
          price: "15",
          priceCurrency: "USD",
          description: TEAM_PLAN.tagline,
        },
      ],
      featureList: features.map((f) => f.h).join(", "),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ]
}

/** Signed-in members go straight to their dashboard — the landing is for visitors. */
async function getSignedInUser() {
  if (
    process.env.NEXT_PUBLIC_USE_MOCKS === "true" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL
  ) {
    return null
  }
  try {
    const user = await resolveAuthUser()
    return user && !user.isAnonymous ? user : null
  } catch {
    return null
  }
}

function FeatureIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    sparkles: (
      <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
    ),
    chat: (
      <path d="M21 12a8 8 0 01-8 8H4l2.3-2.9A8 8 0 1121 12zM8.5 10.5h7M8.5 13.5h4.5" />
    ),
    timer: (
      <path d="M12 21a8 8 0 100-16 8 8 0 000 16zm0-13v5l3.2 1.9M9.5 2.5h5" />
    ),
    gauge: (
      <path d="M4.5 19a9 9 0 1115 0M12 15l4-5.5M12 15a1.8 1.8 0 100 .01" />
    ),
    calendar: (
      <path d="M5 6h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1zm3-3v4m8-4v4M4 11h16M9 15.5l2 2 4-4" />
    ),
    layers: (
      <path d="M12 3l9 5-9 5-9-5 9-5zm-9 9.5l9 5 9-5M3 17l9 5 9-5" />
    ),
    book: (
      <path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5v-15zM4 18.5A2.5 2.5 0 016.5 16H20M8 7.5h8M8 11h5" />
    ),
    flask: (
      <path d="M9.5 3h5M10 3v5.2L4.8 17.5A2 2 0 006.6 20.5h10.8a2 2 0 001.8-3L14 8.2V3M7.5 14.5h9" />
    ),
    shield: (
      <path d="M12 3l7 3v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6l7-3zM9 12l2.2 2.2L15.5 9.7" />
    ),
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="lp-feature-icon-svg"
    >
      {paths[name]}
    </svg>
  )
}

export default async function LandingPage() {
  const user = await getSignedInUser()
  if (user) redirect("/dashboard")

  const structuredData = buildStructuredData()
  const marquee = [...coverage, ...coverage]

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
        overflowX: "clip",
      }}
    >
      <script
        type="application/ld+json"
        // JSON-LD structured data for rich results (app, pricing, FAQ).
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <style>{`
        .lp { --accent:${ACCENT}; --paper:${PAPER}; --ink:${INK};
          --muted:#56584F; --faint:#84867B; --line:#E3DCCE; --card-line:#EAE3D6;
          --serif:var(--lp-serif),'Newsreader',serif; --mono:var(--lp-mono),'Spline Sans Mono',monospace; }
        .lp ::selection { background:var(--accent); color:#fff; }
        .lp a { text-decoration:none; color:inherit; }
        .lp .wrap { max-width:1180px; margin:0 auto; padding-left:24px; padding-right:24px; }

        .lp .kicker { font-family:var(--mono); font-size:12px; letter-spacing:.14em;
          text-transform:uppercase; color:var(--accent); font-weight:500;
          display:inline-flex; align-items:center; gap:8px; }
        .lp .kicker::before { content:""; width:6px; height:6px; border-radius:50%; background:var(--accent); }
        .lp .h2 { font-family:var(--serif); font-weight:500; font-size:clamp(30px,3.6vw,42px);
          line-height:1.08; letter-spacing:-.02em; margin:0; }
        .lp .card { background:#fff; border:1px solid var(--card-line); border-radius:16px; }
        .lp .check { color:var(--accent); font-weight:700; }

        .lp .btn { display:inline-flex; align-items:center; justify-content:center; gap:8px;
          font-weight:600; border-radius:11px; transition:transform .15s ease, box-shadow .15s ease, background .15s ease; }
        .lp .btn:hover { transform:translateY(-1px); }
        .lp .btn:active { transform:translateY(0); }
        .lp .btn-accent { background:var(--accent); color:#fff;
          box-shadow:0 8px 20px -8px color-mix(in oklab, var(--accent) 60%, transparent); }
        .lp .btn-accent:hover { background:#17503A;
          box-shadow:0 12px 26px -8px color-mix(in oklab, var(--accent) 65%, transparent); }
        .lp .btn-ghost { background:#fff; color:var(--ink); border:1px solid #DCD5C7; }
        .lp .btn-ghost:hover { border-color:#C9C1B0; }

        /* Nav */
        .lp-nav { position:sticky; top:0; z-index:50;
          background:color-mix(in oklab, var(--paper) 86%, transparent);
          backdrop-filter:blur(12px); border-bottom:1px solid var(--line); }
        .lp-nav-inner { display:flex; align-items:center; justify-content:space-between; padding-top:14px; padding-bottom:14px; }
        .lp-nav-links { display:flex; align-items:center; gap:26px; font-size:14.5px; font-weight:500; color:#3D403A; }
        .lp-nav-links a:hover { color:var(--accent); }
        @media (max-width:860px){ .lp-nav-links .lp-nav-anchor { display:none; } }

        /* Hero */
        .lp-hero { display:grid; grid-template-columns:1.05fr .95fr; gap:56px; align-items:center;
          padding-top:76px; padding-bottom:48px; }
        @keyframes lp-rise { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
        .lp .rise { animation:lp-rise .7s cubic-bezier(.2,.7,.3,1) both; }
        .lp .rise-1 { animation-delay:.05s } .lp .rise-2 { animation-delay:.15s }
        .lp .rise-3 { animation-delay:.25s } .lp .rise-4 { animation-delay:.35s }
        .lp-hero h1 { font-family:var(--serif); font-weight:500; font-size:clamp(42px,5.2vw,64px);
          line-height:1.03; letter-spacing:-.02em; margin:22px 0; }
        .lp-hero h1 em { font-style:italic; color:var(--accent); }
        .lp-hero .sub { font-size:18px; line-height:1.62; color:var(--muted); max-width:47ch; margin:0 0 30px; }
        .lp-hero-trust { display:flex; flex-wrap:wrap; align-items:center; gap:8px 18px; font-size:14px; color:#6B6D64; margin-top:22px; }
        .lp-hero-trust span { display:flex; align-items:center; gap:7px; }

        /* Product mock */
        .lp-mock { position:relative; }
        .lp-mock-card { position:relative; z-index:1; background:#fff; border:1px solid var(--card-line);
          border-radius:20px; padding:22px;
          box-shadow:0 40px 70px -34px rgba(28,30,22,.32), 0 2px 8px rgba(0,0,0,.04); }
        @keyframes lp-float { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-7px) } }
        .lp-chip { position:absolute; z-index:2; background:#fff; border:1px solid var(--card-line);
          border-radius:14px; padding:12px 15px; box-shadow:0 18px 40px -18px rgba(28,30,22,.35);
          animation:lp-float 5s ease-in-out infinite; }
        .lp-chip-readiness { top:-26px; left:-30px; }
        .lp-chip-tutor { bottom:-30px; right:-18px; max-width:250px; animation-delay:2.5s; }
        .lp-chip-lab { bottom:16%; left:-34px; animation-delay:1.2s; }
        @media (max-width:1240px){ .lp-chip-readiness { left:-8px } .lp-chip-tutor { right:-6px } .lp-chip-lab { left:-10px } }
        @media (max-width:960px){ .lp-chip-lab { display:none } }
        .lp-mock-label { font-family:var(--mono); font-size:11px; letter-spacing:.06em; text-transform:uppercase;
          color:var(--accent); font-weight:600; background:color-mix(in oklab, var(--accent) 10%, #fff);
          padding:5px 10px; border-radius:7px; }
        .lp-mock-meta { font-family:var(--mono); font-size:11px; letter-spacing:.04em; color:#7A7C72;
          display:flex; align-items:center; gap:6px; }
        .lp-opt { display:flex; align-items:center; gap:11px; padding:12px 13px;
          border:1px solid #E8E2D6; border-radius:11px; }
        .lp-opt-key { width:25px; height:25px; flex:none; border-radius:7px; border:1px solid #DCD5C7;
          display:flex; align-items:center; justify-content:center; font-family:var(--mono); font-size:12px; color:#7A7C72; }

        /* Coverage marquee */
        .lp-marquee { overflow:hidden; border-top:1px solid var(--line); border-bottom:1px solid var(--line);
          padding:22px 0; position:relative;
          mask-image:linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
        @keyframes lp-scroll { from { transform:translateX(0) } to { transform:translateX(-50%) } }
        .lp-marquee-track { display:flex; gap:12px; width:max-content; animation:lp-scroll 42s linear infinite; }
        .lp-marquee:hover .lp-marquee-track { animation-play-state:paused; }
        .lp-pill { flex:none; font-size:13.5px; font-weight:500; color:#3D403A; background:#fff;
          border:1px solid #E5DECF; padding:8px 16px; border-radius:99px; white-space:nowrap; }

        /* Features */
        .lp-features { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
        .lp-feature { padding:26px 26px 28px; transition:transform .2s ease, box-shadow .2s ease; }
        .lp-feature:hover { transform:translateY(-3px); box-shadow:0 24px 44px -28px rgba(28,30,22,.3); }
        .lp-feature-icon { width:42px; height:42px; border-radius:12px; color:var(--accent);
          background:color-mix(in oklab, var(--accent) 9%, #fff);
          border:1px solid color-mix(in oklab, var(--accent) 18%, #fff);
          display:flex; align-items:center; justify-content:center; margin-bottom:16px; }
        .lp-feature-icon-svg { width:22px; height:22px; }
        .lp-feature .tag { font-family:var(--mono); font-size:11px; letter-spacing:.1em; text-transform:uppercase;
          color:var(--accent); font-weight:600; margin-bottom:10px; }
        .lp-feature h3 { font-size:18.5px; font-weight:600; margin:0 0 9px; letter-spacing:-.01em; }
        .lp-feature p { margin:0; font-size:14.5px; line-height:1.6; color:var(--muted); }

        /* How it works */
        .lp-how { display:grid; grid-template-columns:.8fr 1.2fr; gap:40px; align-items:start; }
        .lp-step { display:flex; gap:18px; padding:18px 0; }
        .lp-step + .lp-step { border-top:1px solid #EFE9DD; }
        .lp-step .n { font-family:var(--serif); font-size:24px; color:var(--accent); font-weight:500; min-width:38px; }
        .lp-step h3 { font-size:17px; font-weight:600; margin:0 0 5px; }
        .lp-step p { margin:0; font-size:14.5px; line-height:1.55; color:var(--muted); }

        /* Versus */
        .lp-vs { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
        .lp-vs-col { border-radius:18px; padding:30px; }
        .lp-vs-col.old { background:color-mix(in oklab, var(--paper) 55%, #fff); border:1px dashed #D5CDBC; }
        .lp-vs-col.nu { background:#fff; border:1.5px solid var(--accent);
          box-shadow:0 30px 60px -38px color-mix(in oklab, var(--accent) 55%, transparent); }
        .lp-vs-col .head { font-family:var(--mono); font-size:12px; letter-spacing:.1em; text-transform:uppercase;
          font-weight:600; margin-bottom:18px; }
        .lp-vs-row { display:flex; gap:11px; font-size:14.5px; line-height:1.5; padding:10px 0; }
        .lp-vs-col.old .lp-vs-row { color:#6B6D64; border-bottom:1px solid #EBE4D6; }
        .lp-vs-col.nu .lp-vs-row { color:#2C2E28; border-bottom:1px solid #F0EBE0; font-weight:500; }
        .lp-vs-col .lp-vs-row:last-child { border-bottom:none; }

        /* Pricing */
        .lp-pricing { display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px; max-width:1000px; margin:0 auto; }
        .lp-price { font-family:var(--serif); font-size:46px; font-weight:500; }
        .lp-plan-row { display:flex; gap:10px; font-size:14.5px; color:#3D403A; }

        /* FAQ */
        .lp-faq { max-width:760px; margin:0 auto; }
        .lp-faq details { background:#fff; border:1px solid var(--card-line); border-radius:14px;
          padding:0 22px; margin-bottom:10px; }
        .lp-faq summary { cursor:pointer; list-style:none; display:flex; align-items:center; justify-content:space-between;
          gap:16px; padding:18px 0; font-size:16px; font-weight:600; letter-spacing:-.01em; }
        .lp-faq summary::-webkit-details-marker { display:none; }
        .lp-faq summary::after { content:"+"; font-family:var(--mono); font-size:18px; color:var(--accent);
          flex:none; transition:transform .2s ease; }
        .lp-faq details[open] summary::after { transform:rotate(45deg); }
        .lp-faq details p { margin:0; padding:0 0 20px; font-size:14.5px; line-height:1.65; color:var(--muted); }

        /* Final CTA */
        .lp-cta { background:var(--accent); border-radius:24px; padding:72px 40px; text-align:center;
          position:relative; overflow:hidden; }
        .lp-cta::before { content:""; position:absolute; inset:0; pointer-events:none;
          background:radial-gradient(circle at 80% 15%, rgba(255,255,255,.12), transparent 55%),
                     radial-gradient(circle at 10% 90%, rgba(255,255,255,.07), transparent 50%); }

        @media (max-width:960px){
          .lp-features { grid-template-columns:repeat(2,1fr); }
        }
        @media (max-width:860px){
          .lp-hero, .lp-how, .lp-vs, .lp-pricing { grid-template-columns:1fr; }
          .lp-hero { gap:44px; padding-top:52px; }
          .lp-chip-readiness { top:-18px; }
        }
        @media (max-width:640px){
          .lp-features { grid-template-columns:1fr; }
          .lp-cta { padding:56px 24px; }
        }
        @media (prefers-reduced-motion:reduce){
          .lp .rise, .lp-chip, .lp-marquee-track { animation:none; }
        }
      `}</style>

      {/* NAV */}
      <header className="lp-nav">
        <nav className="wrap lp-nav-inner">
          <Link href="/" aria-label="Prepa home">
            <Logo />
          </Link>
          <div className="lp-nav-links">
            <a className="lp-nav-anchor" href="#features">Features</a>
            <a className="lp-nav-anchor" href="#how">How it works</a>
            <a className="lp-nav-anchor" href="#pricing">Pricing</a>
            <a className="lp-nav-anchor" href="#faq">FAQ</a>
            <Link href="/login">Sign in</Link>
            <Link href="/signup" className="btn btn-accent" style={{ fontSize: "15px", padding: "10px 18px" }}>
              Start free
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="wrap lp-hero">
        <div>
          <div className="kicker rise rise-1">AI-powered exam prep</div>
          <h1 className="rise rise-2">
            The last study app you&apos;ll need before you <em>pass</em>
          </h1>
          <p className="sub rise rise-3">
            Prepa teaches your exam&apos;s syllabus with AI lessons, drills you with fresh
            exam-style questions, puts your hands on the real cloud console — and tells
            you exactly when you&apos;re ready. Any certification, even from your own notes.
          </p>
          <div className="rise rise-4" style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
            <Link href="/signup" className="btn btn-accent" style={{ fontSize: "16px", padding: "15px 26px" }}>
              Start practising free
            </Link>
            <a href="#features" className="btn btn-ghost" style={{ fontSize: "16px", padding: "15px 26px" }}>
              See what&apos;s inside
            </a>
          </div>
          <div className="lp-hero-trust rise rise-4">
            <span><span className="check">✓</span>Free to try — no card required</span>
            <span style={{ color: "#CFC8BA" }}>·</span>
            <span><span className="check">✓</span>12 major certs + custom exams</span>
            <span style={{ color: "#CFC8BA" }}>·</span>
            <span><span className="check">✓</span>Cancel anytime</span>
          </div>
        </div>

        {/* PRODUCT MOCK */}
        <div className="lp-mock rise rise-3">
          {/* Floating readiness chip */}
          <div className="lp-chip lp-chip-readiness">
            <div style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: ".1em", textTransform: "uppercase", color: "#84867B", fontWeight: 600, marginBottom: "6px" }}>
              Exam readiness
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontFamily: "var(--serif)", fontSize: "26px", fontWeight: 500, color: ACCENT }}>82%</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: ACCENT, fontWeight: 600 }}>▲ 6 this week</span>
            </div>
            <div style={{ width: "128px", height: "5px", borderRadius: "99px", background: "#EEE8DC", marginTop: "8px", overflow: "hidden" }}>
              <div style={{ width: "82%", height: "100%", background: ACCENT, borderRadius: "99px" }} />
            </div>
          </div>

          {/* Floating AI-tutor chip */}
          <div className="lp-chip lp-chip-tutor">
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "7px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: ACCENT }} />
              <span style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: ".1em", textTransform: "uppercase", color: ACCENT, fontWeight: 600 }}>AI Tutor</span>
            </div>
            <p style={{ margin: 0, fontSize: "12.5px", lineHeight: 1.5, color: "#42453E" }}>
              &ldquo;Why not RDS?&rdquo; — RDS is relational. The question asks for a <strong>NoSQL</strong> store with millisecond latency, which is DynamoDB&apos;s specialty.
            </p>
          </div>

          {/* Floating hands-on-lab chip */}
          <div className="lp-chip lp-chip-lab">
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "6px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: ACCENT }} />
              <span style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: ".1em", textTransform: "uppercase", color: ACCENT, fontWeight: 600 }}>Hands-on lab</span>
            </div>
            <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#2C2E28", marginBottom: "3px" }}>
              Two-tier VPC — complete <span style={{ color: ACCENT }}>✓</span>
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "10.5px", letterSpacing: ".02em", color: "#84867B" }}>
              Cleanup verified · $0.00 billed
            </div>
          </div>

          <div className="lp-mock-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <span className="lp-mock-label">AWS · Databases</span>
              <span className="lp-mock-meta">
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: ACCENT }} />12-DAY STREAK
              </span>
            </div>
            <div style={{ height: "6px", borderRadius: "99px", background: "#EEE8DC", marginBottom: "18px", overflow: "hidden" }}>
              <div style={{ width: "68%", height: "100%", background: ACCENT, borderRadius: "99px" }} />
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "#9A9C90", letterSpacing: ".04em", marginBottom: "8px" }}>
              QUESTION 14 OF 20
            </div>
            <p style={{ fontSize: "16.5px", fontWeight: 600, lineHeight: 1.42, margin: "0 0 16px" }}>
              Which AWS service provides a fully managed NoSQL database with single-digit millisecond latency at any scale?
            </p>
            <div style={{ display: "grid", gap: "9px", marginBottom: "14px" }}>
              <div className="lp-opt">
                <span className="lp-opt-key">A</span>
                <span style={{ fontSize: "14.5px", color: "#3D403A" }}>Amazon RDS</span>
              </div>
              <div className="lp-opt" style={{ border: `1.5px solid ${ACCENT}`, background: `color-mix(in oklab, ${ACCENT} 8%, #fff)` }}>
                <span className="lp-opt-key" style={{ background: ACCENT, border: "none", color: "#fff", fontWeight: 600 }}>B</span>
                <span style={{ fontSize: "14.5px", fontWeight: 600 }}>Amazon DynamoDB</span>
                <span style={{ marginLeft: "auto", color: ACCENT, fontWeight: 700, fontSize: "15px" }}>✓</span>
              </div>
              <div className="lp-opt">
                <span className="lp-opt-key">C</span>
                <span style={{ fontSize: "14.5px", color: "#3D403A" }}>Amazon Redshift</span>
              </div>
            </div>
            <div style={{ background: `color-mix(in oklab, ${ACCENT} 7%, #fff)`, borderLeft: `3px solid ${ACCENT}`, borderRadius: "9px", padding: "12px 14px" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "10.5px", letterSpacing: ".08em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, marginBottom: "5px" }}>Why</div>
              <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.5, color: "#42453E" }}>
                DynamoDB is AWS&apos;s fully managed NoSQL store, built for consistent single-digit-ms latency at scale. RDS and Aurora are relational; Redshift is for analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* EXAM COVERAGE MARQUEE */}
      <section aria-label="Exams covered">
        <div className="wrap" style={{ paddingBottom: "14px" }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: "12px", letterSpacing: ".12em", textTransform: "uppercase", color: "#84867B", fontWeight: 500 }}>
            Bring any exam
          </span>
        </div>
        <div className="lp-marquee">
          <div className="lp-marquee-track">
            {marquee.map((c, i) => (
              <span key={`${c}-${i}`} className="lp-pill" aria-hidden={i >= coverage.length}>
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="wrap" style={{ paddingTop: "14px" }}>
          <Link href="/exams" style={{ fontSize: "14px", fontWeight: 500, color: ACCENT, textDecoration: "underline", textUnderlineOffset: "3px" }}>
            Browse all exam study guides
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="wrap" style={{ padding: "72px 24px 30px", scrollMarginTop: "80px" }}>
        <div style={{ maxWidth: "640px", marginBottom: "42px" }}>
          <div className="kicker" style={{ marginBottom: "14px" }}>What you get</div>
          <h2 className="h2">Everything you need between now and exam day</h2>
        </div>
        <div className="lp-features">
          {features.map((f) => (
            <div key={f.k} className="card lp-feature">
              <div className="lp-feature-icon"><FeatureIcon name={f.icon} /></div>
              <div className="tag">{f.k}</div>
              <h3>{f.h}</h3>
              <p>{f.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="wrap" style={{ padding: "54px 24px", scrollMarginTop: "80px" }}>
        <div className="card" style={{ borderRadius: "22px", padding: "48px 44px" }}>
          <div className="lp-how">
            <div>
              <div className="kicker" style={{ marginBottom: "14px" }}>How it works</div>
              <h2 className="h2" style={{ fontSize: "clamp(28px,3.2vw,38px)", marginBottom: "14px" }}>
                From zero to exam-ready
              </h2>
              <p style={{ fontSize: "15px", lineHeight: 1.6, color: "var(--muted)", margin: "0 0 24px", maxWidth: "36ch" }}>
                No question banks to buy, no content to hunt down. Prepa builds everything around you.
              </p>
              <Link href="/signup" className="btn btn-accent" style={{ fontSize: "15px", padding: "13px 22px" }}>
                Start practising free
              </Link>
            </div>
            <div>
              {steps.map((s) => (
                <div key={s.n} className="lp-step">
                  <span className="n">{s.n}</span>
                  <div>
                    <h3>{s.h}</h3>
                    <p>{s.p}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VERSUS */}
      <section className="wrap" style={{ padding: "40px 24px 30px" }}>
        <div style={{ textAlign: "center", maxWidth: "620px", margin: "0 auto 40px" }}>
          <div className="kicker" style={{ marginBottom: "14px" }}>Why switch</div>
          <h2 className="h2">Question banks quiz you. Prepa gets you ready.</h2>
        </div>
        <div className="lp-vs">
          <div className="lp-vs-col old">
            <div className="head" style={{ color: "#84867B" }}>Static question banks</div>
            {versus.map((v) => (
              <div key={v.old} className="lp-vs-row">
                <span style={{ color: "#B0A890", flex: "none" }}>✕</span>
                {v.old}
              </div>
            ))}
          </div>
          <div className="lp-vs-col nu">
            <div className="head" style={{ color: ACCENT }}>Prepa</div>
            {versus.map((v) => (
              <div key={v.nu} className="lp-vs-row">
                <span className="check" style={{ flex: "none" }}>✓</span>
                {v.nu}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="wrap" style={{ padding: "50px 24px 30px", scrollMarginTop: "80px" }}>
        <div style={{ textAlign: "center", maxWidth: "560px", margin: "0 auto 40px" }}>
          <div className="kicker" style={{ marginBottom: "14px" }}>Pricing</div>
          <h2 className="h2" style={{ marginBottom: "12px" }}>Start free. Go all-in when you&apos;re serious.</h2>
          <p style={{ fontSize: "16px", color: "var(--muted)", margin: 0 }}>Less than a coffee a month. Cancel anytime.</p>
        </div>
        <div className="lp-pricing">
          {/* Free */}
          <div className="card" style={{ borderRadius: "18px", padding: "32px" }}>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#3D403A", marginBottom: "12px" }}>{freePlan.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "6px" }}>
              <span className="lp-price">{freePlan.price}</span>
              <span style={{ fontSize: "15px", color: "#7A7C72" }}>/{freePlan.cycle}</span>
            </div>
            <p style={{ fontSize: "14.5px", color: "var(--muted)", margin: "0 0 22px" }}>
              {freePlan.tagline}
            </p>
            <div style={{ display: "grid", gap: "11px", marginBottom: "26px" }}>
              {freePlan.features.map((f) => (
                <div key={f} className="lp-plan-row"><span className="check">✓</span>{f}</div>
              ))}
            </div>
            <Link href="/signup" className="btn" style={{ display: "flex", width: "100%", background: "#F4F0E8", border: "1px solid #E1DACB", fontSize: "15px", padding: "13px" }}>
              Start free
            </Link>
          </div>
          {/* Pro */}
          <div style={{ background: "#fff", border: `1.5px solid ${ACCENT}`, borderRadius: "18px", padding: "32px", position: "relative", boxShadow: `0 30px 60px -34px color-mix(in oklab, ${ACCENT} 50%, transparent)` }}>
            <span style={{ position: "absolute", top: "-12px", left: "32px", fontFamily: "var(--mono)", fontSize: "10.5px", letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600, color: "#fff", background: ACCENT, padding: "5px 12px", borderRadius: "99px" }}>
              Most popular
            </span>
            <div style={{ fontSize: "15px", fontWeight: 600, color: ACCENT, marginBottom: "12px" }}>{proPlan.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "2px" }}>
              <span className="lp-price">{proPlan.price}</span>
              <span style={{ fontSize: "15px", color: "#7A7C72" }}>/{proPlan.cycle}</span>
            </div>
            <div style={{ fontSize: "13px", color: "#7A7C72", marginBottom: "6px" }}>
              or {PRO_ANNUAL_PRICE_LABEL}/year — save 45%
            </div>
            <p style={{ fontSize: "14.5px", color: "var(--muted)", margin: "0 0 22px" }}>
              {proPlan.tagline}
            </p>
            <div style={{ display: "grid", gap: "11px", marginBottom: "26px" }}>
              {proPlan.features.map((f) => (
                <div key={f} className="lp-plan-row"><span className="check">✓</span>{f}</div>
              ))}
            </div>
            <LandingProButton tier="pro" label="Get Pro" />
          </div>
          {/* Exam Pass */}
          <div className="card" style={{ borderRadius: "18px", padding: "32px" }}>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#3D403A", marginBottom: "12px" }}>{examPassPlan.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "6px" }}>
              <span className="lp-price">{examPassPlan.price}</span>
              <span style={{ fontSize: "15px", color: "#7A7C72" }}>/{examPassPlan.cycle}</span>
            </div>
            <p style={{ fontSize: "14.5px", color: "var(--muted)", margin: "0 0 22px" }}>
              {examPassPlan.tagline}
            </p>
            <div style={{ display: "grid", gap: "11px", marginBottom: "26px" }}>
              {examPassPlan.features.map((f) => (
                <div key={f} className="lp-plan-row"><span className="check">✓</span>{f}</div>
              ))}
            </div>
            <LandingProButton tier="exam_pass" label="Get Exam Pass" filled={false} />
          </div>
        </div>
        {/* Team */}
        <div className="card" style={{ maxWidth: "1000px", margin: "20px auto 0", borderRadius: "18px", padding: "28px 32px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "24px" }}>
          <div style={{ flex: "1 1 240px", minWidth: "220px" }}>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#3D403A", marginBottom: "10px" }}>
              Prepa for Teams
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "6px" }}>
              <span className="lp-price">{TEAM_PLAN.price}</span>
              <span style={{ fontSize: "15px", color: "#7A7C72" }}>/{TEAM_PLAN.cycle}</span>
            </div>
            <p style={{ fontSize: "14.5px", color: "var(--muted)", margin: "0 0 18px" }}>
              {TEAM_PLAN.tagline}
            </p>
            <Link href="/team" className="btn" style={{ display: "inline-flex", background: "#F4F0E8", border: "1px solid #E1DACB", fontSize: "15px", padding: "13px 22px" }}>
              Start a team
            </Link>
          </div>
          <div style={{ flex: "2 1 320px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "11px" }}>
            {TEAM_PLAN.features.map((f) => (
              <div key={f} className="lp-plan-row"><span className="check">✓</span>{f}</div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="wrap" style={{ padding: "50px 24px 40px", scrollMarginTop: "80px" }}>
        <div style={{ textAlign: "center", maxWidth: "560px", margin: "0 auto 36px" }}>
          <div className="kicker" style={{ marginBottom: "14px" }}>FAQ</div>
          <h2 className="h2">Questions, answered</h2>
        </div>
        <div className="lp-faq">
          {faqs.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: "20px 24px 64px" }}>
        <div className="lp-cta" style={{ maxWidth: "1180px", margin: "0 auto" }}>
          <h2 style={{ position: "relative", fontFamily: "var(--serif)", fontWeight: 500, fontSize: "clamp(30px,3.8vw,44px)", lineHeight: 1.06, letterSpacing: "-.02em", color: "#fff", margin: "0 0 16px" }}>
            Your exam won&apos;t study for itself
          </h2>
          <p style={{ position: "relative", fontSize: "17px", lineHeight: 1.6, color: "rgba(255,255,255,.86)", maxWidth: "46ch", margin: "0 auto 28px" }}>
            Get 10 free AI-generated questions every day, with explanations that actually teach. Set up in under a minute.
          </p>
          <Link href="/signup" className="btn" style={{ position: "relative", background: "#fff", color: ACCENT, fontWeight: 700, fontSize: "16px", padding: "16px 30px", borderRadius: "12px", boxShadow: "0 14px 30px -12px rgba(0,0,0,.35)" }}>
            Start practising free
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--line)" }}>
        <div className="wrap" style={{ padding: "30px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Logo showWordmark={false} />
            <span style={{ fontSize: "14px", color: "#6B6D64" }}>© {new Date().getFullYear()} Prepa</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "22px", fontSize: "14px" }}>
            <Link href="/exams" style={{ color: "#6B6D64" }}>Exam Guides</Link>
            <Link href="/blog" style={{ color: "#6B6D64" }}>Blog</Link>
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
