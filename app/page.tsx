import Link from "next/link"
import { redirect } from "next/navigation"
import { Newsreader, Public_Sans, Spline_Sans_Mono } from "next/font/google"
import { Logo } from "@/components/layout/logo"
import { LandingProButton } from "@/components/upgrade/landing-pro-button"
import { resolveAuthUser } from "@/lib/supabase/resolve-user"
import { SITE_DESCRIPTION, SITE_NAME, getSiteUrl } from "@/lib/config/site"
import { PLANS, PRO_ANNUAL_PRICE_LABEL, TEAM_PLAN } from "@/lib/config/pricing"
import { slugForExamCode } from "@/lib/content/exam-slugs"
import { listExamPresets, listExamPresetsByProvider } from "@/lib/exams/registry"
import type { ExamProvider } from "@/lib/exams/types"

// Editorial/broadsheet type system: a serif for display and reading copy, a
// mono for every piece of metadata (folios, labels, leaders), and the sans kept
// back for interface chrome only.
const serif = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
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

/**
 * Built from the exam registry so the catalogue and the "N certifications"
 * claim can never drift from what the app actually supports.
 */
const presets = listExamPresets()
const PRESET_COUNT = presets.length
const providerGroups = listExamPresetsByProvider()

const PROVIDER_LABELS: Record<ExamProvider, string> = {
  aws: "Amazon Web Services",
  azure: "Microsoft Azure",
  gcp: "Google Cloud",
  comptia: "CompTIA",
  cisco: "Cisco",
  isc2: "ISC2",
  custom: "Custom",
}

/** Vendor prefixes are redundant under a vendor heading — drop them. */
function shortExamName(name: string): string {
  return name
    .replace(/^AWS Certified\s+/, "")
    .replace(/^Microsoft Certified:\s+/, "")
    .replace(/^Microsoft\s+/, "")
    .replace(/^Google Cloud\s+/, "")
    .replace(/^CompTIA\s+/, "")
    .replace(/^Cisco\s+/, "")
    .replace(/^ISC2\s+/, "")
}

const facts = [
  { n: PRESET_COUNT, l: "exams covered", p: "AWS, Azure, Google Cloud, CompTIA, Cisco and CISSP — or describe any other exam and Prepa builds the syllabus for it." },
  { n: "2×", l: "checked answers", p: "Every multiple-choice answer is confirmed by a second AI before it reaches you. If the two disagree, you never see the question." },
  { n: 0, l: "recycled questions", p: "Nothing comes from a stale dump. Every session is written for your exam and the topics you keep getting wrong." },
  { n: "$0", l: "to get started", p: "30 practice questions, two lessons, a hands-on lab and a mock exam — free, and no card to sign up." },
]

const features = [
  {
    k: "Lessons",
    h: "Learn the syllabus, not just the questions",
    p: "Your exam's full syllabus, weighted exactly like the real test, taught with decision tables, the traps examiners love, and the facts worth memorising — then a knowledge check that proves it stuck.",
  },
  {
    k: "Practice",
    h: "Drill the topics you keep getting wrong",
    p: "Fresh exam-style questions every session, aimed at your weakest domains. The more you practise, the more the questions target what's actually holding your score down.",
  },
  {
    k: "Hands-on labs",
    h: "Build it for real, in a real console",
    p: "Guided labs you run in your own free-tier cloud account — build the VPC, deploy the pipeline. Checkpoints confirm you did it, and a cleanup list means nothing keeps running and nothing gets billed.",
  },
  {
    k: "Mock exams",
    h: "Sit the real thing before you sit the real thing",
    p: "Timed, full-length mocks in your exam's actual question formats — multiple choice, drag-to-order, matching, Yes/No grids, even typed CLI commands. No surprises on the day.",
  },
  {
    k: "Readiness score",
    h: "Know when you're ready to book",
    p: "One number that climbs as you improve, backed by mastery tracking in every exam domain. Book with evidence instead of a gut feeling.",
  },
  {
    k: "Study plan",
    h: "Know what to study today",
    p: "Set your exam date and Prepa builds the daily plan — weighted to your weak areas, rebalanced when life gets in the way, and honest with you about pace.",
  },
  {
    k: "AI tutor",
    h: "Get an answer to 'but why?'",
    p: "Every question and lesson has a tutor attached. Ask a follow-up, ask for a mnemonic, ask for it again but simpler — until it actually makes sense.",
  },
  {
    k: "Flashcards",
    h: "Stop forgetting what you already learned",
    p: "Questions you miss and key facts from your lessons turn into flashcards automatically, scheduled to reappear right before you'd have forgotten them.",
  },
  {
    k: "Verified answers",
    h: "Never revise from a wrong answer",
    p: "A second, independent AI answers every multiple-choice question with the answer key hidden. If it disagrees, the question is thrown out before it ever reaches you.",
  },
  {
    k: "Real sources",
    h: "Check the answer against the vendor",
    p: "Explanations link to the official documentation — AWS, Microsoft Learn, Google Cloud, Cisco. Links anywhere else, or links that have gone dead, are stripped before you see them.",
  },
]

const steps = [
  {
    n: "01",
    h: "Tell Prepa which exam you're taking",
    p: `Pick one of ${PRESET_COUNT} certifications, describe any other exam, or upload your own study notes. About thirty seconds later you have a full syllabus, weighted exactly like the real test.`,
  },
  {
    n: "02",
    h: "Learn each topic, then go and build it",
    p: "Lessons teach the topic properly — decision tables, examiner traps, the facts worth memorising. Then a hands-on lab drops you into a real cloud console to do it for yourself.",
  },
  {
    n: "03",
    h: "Practise where you're actually weak",
    p: "Every session brings fresh questions aimed at the domains dragging your score down, with explanations you can check and a tutor for the follow-up questions.",
  },
  {
    n: "04",
    h: "Book the exam when the score says go",
    p: "Sit timed, full-length mocks in the real question formats. Your readiness score and per-domain mastery tell you when you're ready — and the daily plan gets you there by your exam date.",
  },
]

const versus = [
  { old: "Answers you just have to take on faith", nu: "Every multiple-choice answer confirmed by a second AI" },
  { old: "No source to check when you disagree", nu: "Every explanation links to the vendor's own documentation" },
  { old: "The same questions, memorised by round three", nu: "Fresh questions every session, aimed at your weak spots" },
  { old: "Written for an exam version that's since changed", nu: "Generated against the current published blueprint" },
  { old: "Theory you read but never actually do", nu: "Guided labs you build in your own cloud account" },
  { old: "Booking the exam and hoping for the best", nu: "A readiness score and mastery in every exam domain" },
  { old: "A PDF chained to your desktop", nu: "Installs on your phone and works offline" },
]

/** Reason to believe the pass-first-time promise — see the #trust band. */
const verifySteps = [
  {
    n: "01",
    h: "Written from the official exam blueprint",
    p: "Questions follow your exam's published domains and weightings — the vendor's own outline, not somebody's guess at what might come up.",
  },
  {
    n: "02",
    h: "Answered again by a second AI",
    p: "A different AI answers the question with the answer key hidden from it. If the two don't agree, the question is thrown out. You only ever see the ones they both got right.",
  },
  {
    n: "03",
    h: "Backed by a link you can check yourself",
    p: "Every explanation cites the vendor's own documentation, and we test the link works before you see it. Made-up URLs get stripped out.",
  },
]

const freePlan = PLANS.find((p) => p.tier === "free")!
const proPlan = PLANS.find((p) => p.tier === "pro")!
const examPassPlan = PLANS.find((p) => p.tier === "exam_pass")!

/**
 * Hero contents list. Counts are derived from the section data above so the
 * folio numbers and tallies can't drift as sections are edited.
 */
const contents = [
  { n: "02", t: "How it works", c: `${steps.length} steps`, href: "#how" },
  { n: "03", t: "What you get", c: `${features.length} features`, href: "#features" },
  { n: "04", t: "Why you can trust it", c: `${verifySteps.length} checks`, href: "#trust" },
  { n: "05", t: "Exams we cover", c: `${PRESET_COUNT} exams`, href: "#exams" },
  { n: "07", t: "Pricing", c: `From ${freePlan.price}`, href: "#pricing" },
]

const faqs = [
  {
    q: "How do I know the answer keys are right?",
    a: "Every multiple-choice question is answered a second time by a separate, independent model that never sees the answer key — it sits the question cold. If its answer doesn't match, the question is discarded and you never see it. Explanations link to the vendor's own documentation, and those links are checked before delivery. If a question still looks wrong, flag it: it gets independently re-checked and removed from your review queue if the check agrees with you.",
  },
  {
    q: "Which certification exams does Prepa cover?",
    a: `Prepa ships ${PRESET_COUNT} certifications built from their official exam blueprints — including ${presets.slice(0, 6).map((p) => p.exam).join(", ")} and more — and works with any other certification exam you describe. You can also upload your own PDF study notes and Prepa will build questions from them.`,
  },
  {
    q: "Is Prepa free to use?",
    a: "Yes. The free plan lets you generate practice questions, a mock exam, and lessons to try everything out. Pro ($12/month, or $79/year) unlocks daily practice, mock exams, hands-on labs, and the AI tutor and coach. Exam Pass ($39 one-time) gives you everything at exam-cram volume — 250 questions and 2 full mock exams every day — for 90 days. Teams get per-seat pricing at $15/seat/month.",
  },
  {
    q: "How is Prepa different from static question banks?",
    a: "Question banks recycle a fixed set of questions and ask you to trust the answer key. Prepa checks its own work — every multiple-choice key is blind-verified by a second, independent model, and every explanation cites the vendor's own documentation. On top of that you get lessons that teach the syllabus, questions tuned to your weak areas, hands-on labs in the real cloud console, spaced-repetition flashcards, and a readiness score that tells you when you're prepared.",
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

/** Section folio: a rule, a number, and a title — the page's editorial spine. */
function Folio({ n, title, aside }: { n: string; title: string; aside?: string }) {
  return (
    <div className="lp-folio">
      <span className="lp-folio-n">{n}</span>
      <span className="lp-folio-t">{title}</span>
      {aside ? <span className="lp-folio-a">{aside}</span> : null}
    </div>
  )
}

/** A metadata row with dot leaders, as used on the specimen record. */
function LedgerRow({
  label,
  detail,
  value,
}: {
  label: string
  detail: string
  value: string
}) {
  return (
    <div className="lp-ledger-row">
      <span className="lp-ledger-label">{label}</span>
      <span className="lp-ledger-detail">{detail}</span>
      <span className="lp-ledger-lead" aria-hidden />
      <span className="lp-ledger-value">{value}</span>
    </div>
  )
}

export default async function LandingPage() {
  const user = await getSignedInUser()
  if (user) redirect("/dashboard")

  const structuredData = buildStructuredData()

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
          --body:#3A3D36; --muted:#5C5E55; --faint:#8A8C80;
          --rule:#CFC7B4; --hair:#E1DACA;
          --serif:var(--lp-serif),'Newsreader',serif;
          --mono:var(--lp-mono),'Spline Sans Mono',monospace;
          --sans:var(--lp-sans),system-ui,sans-serif; }
        .lp ::selection { background:var(--accent); color:#fff; }
        .lp a { text-decoration:none; color:inherit; }
        .lp .wrap { max-width:1240px; margin:0 auto; padding-left:28px; padding-right:28px; }
        @media (max-width:600px){ .lp .wrap { padding-left:20px; padding-right:20px; } }

        /* --- Editorial primitives ------------------------------------- */
        .lp .meta { font-family:var(--mono); font-size:11px; letter-spacing:.16em;
          text-transform:uppercase; font-weight:500; }
        .lp .display { font-family:var(--serif); font-weight:400; letter-spacing:-.032em;
          line-height:.94; text-wrap:balance; }
        .lp .deck { font-family:var(--serif); font-size:clamp(18px,1.5vw,21px); line-height:1.5;
          color:var(--body); font-weight:300; }
        .lp .prose { font-size:15px; line-height:1.62; color:var(--muted); }
        .lp .rule-top { border-top:1px solid var(--rule); }
        .lp .hair-top { border-top:1px solid var(--hair); }

        /* Section folio */
        .lp-folio { display:flex; align-items:baseline; gap:16px; padding:12px 0 0;
          border-top:2px solid var(--ink); margin-bottom:34px; }
        .lp-folio-n { font-family:var(--mono); font-size:11px; letter-spacing:.16em;
          font-weight:600; color:var(--accent); }
        .lp-folio-t { font-family:var(--mono); font-size:11px; letter-spacing:.16em;
          text-transform:uppercase; font-weight:500; color:var(--ink); }
        .lp-folio-a { margin-left:auto; font-family:var(--mono); font-size:11px;
          letter-spacing:.12em; text-transform:uppercase; color:var(--faint); }
        @media (max-width:600px){ .lp-folio-a { display:none; } }

        /* Links & buttons — square, ruled, no lift, no glow */
        .lp .btn { display:inline-flex; align-items:center; justify-content:center; gap:10px;
          font-family:var(--sans); font-weight:600; font-size:15px; padding:14px 24px;
          border-radius:2px; transition:background .15s ease, color .15s ease, border-color .15s ease; }
        .lp .btn-accent { background:var(--accent); color:#fff; border:1px solid var(--accent); }
        .lp .btn-accent:hover { background:#164634; border-color:#164634; }
        .lp .btn-ghost { background:transparent; color:var(--ink); border:1px solid var(--rule); }
        .lp .btn-ghost:hover { border-color:var(--ink); }
        .lp .ulink { color:var(--accent); border-bottom:1px solid color-mix(in oklab, var(--accent) 35%, transparent);
          padding-bottom:1px; }
        .lp .ulink:hover { border-bottom-color:var(--accent); }

        /* --- Masthead -------------------------------------------------- */
        .lp-rule-accent { height:3px; background:var(--accent); }
        .lp-mast { position:sticky; top:0; z-index:50; background:var(--paper);
          border-bottom:1px solid var(--ink); }
        .lp-mast-inner { display:flex; align-items:center; justify-content:space-between;
          gap:24px; padding:14px 0; }
        .lp-wordmark { display:flex; align-items:center; gap:10px; }
        .lp-wordmark span { font-family:var(--serif); font-size:23px; font-weight:500;
          letter-spacing:.02em; line-height:1; }
        .lp-mast-nav { display:flex; align-items:center; gap:26px; }
        .lp-mast-nav a { font-family:var(--mono); font-size:11px; letter-spacing:.14em;
          text-transform:uppercase; color:var(--body); }
        .lp-mast-nav a:hover { color:var(--accent); }
        .lp-mast-cta { font-family:var(--mono); font-size:11px; letter-spacing:.14em;
          text-transform:uppercase; color:#fff !important; background:var(--ink);
          padding:9px 15px; border-radius:2px; }
        .lp-mast-cta:hover { background:var(--accent); }
        @media (max-width:900px){ .lp-mast-nav .lp-mast-anchor { display:none; } }

        /* --- Hero ------------------------------------------------------ */
        .lp-hero { padding-top:52px; padding-bottom:0; }
        .lp-dateline { display:flex; align-items:baseline; gap:18px; flex-wrap:wrap;
          padding-bottom:14px; }
        .lp-dateline .k { font-family:var(--mono); font-size:11px; letter-spacing:.16em;
          text-transform:uppercase; color:var(--accent); font-weight:600; }
        .lp-dateline .r { margin-left:auto; font-family:var(--mono); font-size:11px;
          letter-spacing:.12em; text-transform:uppercase; color:var(--faint); }
        .lp-hero h1 { margin:26px 0 34px; font-size:clamp(40px,7.6vw,98px); max-width:16ch; }
        .lp-hero h1 em { font-style:italic; font-weight:300; color:var(--accent); }
        .lp-hero-cols { display:grid; grid-template-columns:1fr 1fr; gap:0 56px;
          border-top:1px solid var(--rule); padding-top:30px; padding-bottom:56px; }
        .lp-hero-left { max-width:44ch; }
        .lp-hero-actions { display:flex; flex-wrap:wrap; gap:12px; margin:28px 0 20px; }
        .lp-hero-fine { font-family:var(--mono); font-size:11px; letter-spacing:.08em;
          text-transform:uppercase; color:var(--faint); line-height:1.9; }

        /* Contents — fills the hero's second half the way a masthead page would */
        .lp-toc { margin-top:44px; border-top:1px solid var(--rule); padding-top:14px; }
        .lp-toc-h { font-family:var(--mono); font-size:10.5px; letter-spacing:.16em;
          text-transform:uppercase; color:var(--faint); margin-bottom:6px; display:block; }
        .lp-toc-row { display:flex; align-items:baseline; gap:10px; padding:8px 0;
          border-bottom:1px solid var(--hair); }
        .lp-toc-row .n { font-family:var(--mono); font-size:11px; letter-spacing:.1em;
          color:var(--accent); font-weight:600; flex:none; }
        .lp-toc-row .t { font-family:var(--serif); font-size:16px; }
        .lp-toc-row .lead { flex:1; border-bottom:1px dotted var(--rule); transform:translateY(-4px); }
        .lp-toc-row .c { font-family:var(--mono); font-size:10.5px; letter-spacing:.08em;
          text-transform:uppercase; color:var(--faint); white-space:nowrap; }
        .lp-toc-row:hover .t { color:var(--accent); }
        @media (max-width:900px){ .lp-toc { display:none; } }
        @media (max-width:900px){
          .lp-hero-cols { grid-template-columns:1fr; gap:40px; }
          .lp-hero h1 { margin:20px 0 26px; }
        }
        @media (max-width:640px){
          /* Once the dateline wraps, the right-hand aside reads as a stray
             indent — put it back on the left margin and stretch the CTAs. */
          .lp-dateline .r { margin-left:0; }
          .lp-hero-actions { display:grid; grid-template-columns:1fr; gap:10px; }
        }

        /* Specimen record — flat, ruled, printed. No shadow, no float. */
        /* align-self:start — otherwise the grid stretches the panel to match the
           taller text column and leaves dead space under the ledger. */
        .lp-spec { border:1px solid var(--ink); background:#FAF7F1; align-self:start; }
        .lp-spec-head { display:flex; align-items:baseline; justify-content:space-between;
          gap:14px; padding:11px 18px; border-bottom:1px solid var(--ink); background:var(--ink); }
        .lp-spec-head span { font-family:var(--mono); font-size:10.5px; letter-spacing:.14em;
          text-transform:uppercase; color:#EDE7DA; }
        .lp-spec-head .ok { color:#8FD3B4; }
        .lp-spec-body { padding:18px 18px 16px; }
        .lp-spec-src { font-family:var(--mono); font-size:10.5px; letter-spacing:.12em;
          text-transform:uppercase; color:var(--faint); margin-bottom:10px; }
        .lp-spec-q { font-family:var(--serif); font-size:19px; line-height:1.35; font-weight:400;
          margin:0 0 16px; letter-spacing:-.01em; }
        .lp-spec-opt { display:flex; gap:12px; align-items:baseline; padding:7px 0;
          border-top:1px solid var(--hair); font-size:14.5px; color:var(--body); }
        .lp-spec-opt b { font-family:var(--mono); font-size:12px; color:var(--faint); font-weight:500; }
        .lp-spec-opt.key { color:var(--ink); font-weight:600; }
        .lp-spec-opt.key b { color:var(--accent); font-weight:600; }
        .lp-spec-tick { margin-left:auto; font-family:var(--mono); font-size:10px;
          letter-spacing:.12em; text-transform:uppercase; color:var(--accent); font-weight:600; }
        .lp-spec-why { border-top:1px solid var(--hair); padding:14px 18px 16px;
          background:color-mix(in oklab, var(--accent) 5%, #FAF7F1); }
        .lp-spec-why-h { font-family:var(--mono); font-size:10px; letter-spacing:.14em;
          text-transform:uppercase; color:var(--accent); font-weight:600; margin-bottom:7px; }
        .lp-spec-why p { margin:0; font-size:13.5px; line-height:1.55; color:var(--body); }
        .lp-spec-cite { display:inline-block; margin-top:9px; font-family:var(--mono);
          font-size:10.5px; letter-spacing:.06em; color:var(--accent); }
        .lp-spec-ledger { border-top:1px solid var(--ink); padding:14px 18px 16px; }
        .lp-ledger-row { display:flex; align-items:baseline; gap:8px; padding:5px 0;
          font-family:var(--mono); font-size:11px; letter-spacing:.06em; }
        .lp-ledger-label { text-transform:uppercase; color:var(--ink); font-weight:600;
          flex:none; width:96px; }
        .lp-ledger-detail { color:var(--faint); flex:none; white-space:nowrap;
          overflow:hidden; text-overflow:ellipsis; max-width:46%; }
        .lp-ledger-lead { flex:1; border-bottom:1px dotted var(--rule); transform:translateY(-3px); }
        .lp-ledger-value { color:var(--accent); font-weight:600; flex:none; text-transform:uppercase; }
        @media (max-width:420px){
          .lp-ledger-label { width:72px; }
          .lp-ledger-detail { display:none; }
        }

        /* --- Facts strip ----------------------------------------------- */
        .lp-facts { display:grid; grid-template-columns:repeat(4,1fr);
          border-top:2px solid var(--ink); border-bottom:1px solid var(--rule); }
        .lp-fact { padding:26px 26px 28px; }
        .lp-fact + .lp-fact { border-left:1px solid var(--hair); }
        .lp-fact .n { font-family:var(--serif); font-size:clamp(38px,4.4vw,56px); font-weight:400;
          line-height:1; letter-spacing:-.03em; color:var(--accent); display:block; }
        .lp-fact .l { font-family:var(--mono); font-size:11px; letter-spacing:.14em;
          text-transform:uppercase; color:var(--ink); display:block; margin:12px 0 8px; }
        .lp-fact .p { font-size:13.5px; line-height:1.55; color:var(--muted); margin:0; }
        @media (max-width:900px){
          .lp-facts { grid-template-columns:repeat(2,1fr); }
          .lp-fact:nth-child(odd) { border-left:none; }
          .lp-fact:nth-child(n+3) { border-top:1px solid var(--hair); }
          .lp-fact { padding:22px 18px; }
        }
        @media (max-width:520px){
          .lp-facts { grid-template-columns:1fr; }
          .lp-fact { border-left:none !important; }
          .lp-fact + .lp-fact { border-top:1px solid var(--hair); }
        }

        /* --- Two-column section (sticky label + content) ---------------- */
        .lp-sec { padding:66px 0; }
        .lp-split { display:grid; grid-template-columns:minmax(210px,1fr) 2.4fr; gap:0 56px; }
        .lp-split-label { position:sticky; top:96px; align-self:start; }
        .lp-split-label h2 { font-family:var(--serif); font-weight:400; font-size:clamp(28px,3.1vw,40px);
          line-height:1.02; letter-spacing:-.028em; margin:0 0 14px; text-wrap:balance; }
        .lp-split-label p { margin:0; font-size:14.5px; line-height:1.6; color:var(--muted); max-width:32ch; }
        @media (max-width:900px){
          .lp-sec { padding:48px 0; }
          .lp-split { grid-template-columns:1fr; gap:28px; }
          .lp-split-label { position:static; }
        }

        /* Numbered editorial rows (method + how it works) */
        .lp-rows > * { display:grid; grid-template-columns:56px 1fr; gap:0 20px;
          padding:22px 0; border-top:1px solid var(--hair); }
        .lp-rows > *:first-child { border-top:1px solid var(--rule); }
        .lp-rows .n { font-family:var(--mono); font-size:11px; letter-spacing:.14em;
          color:var(--accent); font-weight:600; padding-top:5px; }
        .lp-rows h3 { font-family:var(--serif); font-size:22px; font-weight:400; letter-spacing:-.018em;
          margin:0 0 7px; line-height:1.2; }
        .lp-rows p { margin:0; font-size:15px; line-height:1.62; color:var(--muted); max-width:62ch; }
        @media (max-width:520px){
          .lp-rows > * { grid-template-columns:1fr; gap:6px; }
          .lp-rows .n { padding-top:0; }
        }

        /* --- Catalogue -------------------------------------------------- */
        /* Flowing columns, not a grid: a grid aligns rows and strands whole
           vendor groups beside the 12-deep AWS list. */
        .lp-cat { columns:2; column-gap:56px; }
        .lp-cat-group { break-inside:avoid; margin:0 0 30px; }
        .lp-cat-group > .h { font-family:var(--mono); font-size:11px; letter-spacing:.14em;
          text-transform:uppercase; color:var(--faint); padding-bottom:8px;
          border-bottom:1px solid var(--rule); display:flex; justify-content:space-between; }
        .lp-cat-row { display:flex; align-items:baseline; gap:10px; padding:9px 0;
          border-bottom:1px solid var(--hair); }
        .lp-cat-row .t { font-family:var(--serif); font-size:16.5px; font-weight:400; letter-spacing:-.01em; }
        .lp-cat-row .lead { flex:1; border-bottom:1px dotted var(--rule); transform:translateY(-4px); }
        .lp-cat-row .c { font-family:var(--mono); font-size:11px; letter-spacing:.08em;
          color:var(--faint); white-space:nowrap; }
        a.lp-cat-row:hover .t { color:var(--accent); }
        a.lp-cat-row:hover .c { color:var(--accent); }
        @media (max-width:760px){ .lp-cat { columns:1; } }

        /* --- Feature index ---------------------------------------------- */
        .lp-index { display:grid; grid-template-columns:repeat(2,1fr); gap:0 56px; }
        .lp-item { padding:24px 0 26px; border-top:1px solid var(--hair); }
        .lp-index > .lp-item:nth-child(-n+2) { border-top:1px solid var(--rule); }
        .lp-item .k { font-family:var(--mono); font-size:10.5px; letter-spacing:.14em;
          text-transform:uppercase; color:var(--accent); font-weight:600; }
        .lp-item h3 { font-family:var(--serif); font-size:24px; font-weight:400; letter-spacing:-.02em;
          line-height:1.15; margin:10px 0 9px; }
        .lp-item p { margin:0; font-size:14.5px; line-height:1.62; color:var(--muted); }
        @media (max-width:760px){
          .lp-index { grid-template-columns:1fr; }
          .lp-index > .lp-item:nth-child(2) { border-top:1px solid var(--hair); }
        }

        /* --- Versus table ------------------------------------------------ */
        .lp-vs { width:100%; border-collapse:collapse; text-align:left; }
        .lp-vs th { font-family:var(--mono); font-size:11px; letter-spacing:.14em;
          text-transform:uppercase; font-weight:600; padding:0 20px 12px 0;
          border-bottom:2px solid var(--ink); width:50%; }
        .lp-vs th.nu { color:var(--accent); padding-left:20px; }
        .lp-vs td { padding:16px 20px 16px 0; border-bottom:1px solid var(--hair);
          font-size:15px; line-height:1.5; vertical-align:top; }
        .lp-vs td.old { color:var(--faint); text-decoration:line-through;
          text-decoration-color:var(--rule); text-decoration-thickness:1px; }
        .lp-vs td.nu { color:var(--ink); font-weight:500; padding-left:20px;
          border-left:1px solid var(--hair); }
        @media (max-width:640px){
          .lp-vs, .lp-vs tbody, .lp-vs tr, .lp-vs td { display:block; width:100%; }
          .lp-vs thead { display:none; }
          .lp-vs tr { border-bottom:1px solid var(--rule); padding:14px 0; }
          .lp-vs td { border:none; padding:3px 0; }
          .lp-vs td.nu { padding-left:0; border-left:none; }
        }

        /* --- Pricing ------------------------------------------------------ */
        .lp-price-lead { font-family:var(--serif); font-size:clamp(17px,1.5vw,20px);
          font-weight:300; line-height:1.5; color:var(--body); max-width:58ch; margin:-14px 0 30px; }
        .lp-plans { display:grid; grid-template-columns:repeat(3,1fr);
          border-top:2px solid var(--ink); }
        .lp-plan { padding:26px 26px 30px; display:flex; flex-direction:column; }
        .lp-plan + .lp-plan { border-left:1px solid var(--hair); }
        .lp-plan.feat { background:#FAF7F1; box-shadow:inset 0 3px 0 var(--accent); }
        .lp-plan-name { font-family:var(--mono); font-size:11px; letter-spacing:.14em;
          text-transform:uppercase; font-weight:600; display:flex; justify-content:space-between;
          align-items:baseline; gap:10px; }
        .lp-plan-name .rec { color:var(--accent); }
        .lp-plan-price { font-family:var(--serif); font-size:52px; font-weight:400;
          letter-spacing:-.035em; line-height:1; margin:18px 0 0; }
        .lp-plan-cycle { font-family:var(--mono); font-size:11px; letter-spacing:.1em;
          text-transform:uppercase; color:var(--faint); margin-top:8px; }
        .lp-plan-tag { font-family:var(--serif); font-size:16px; line-height:1.45; font-weight:300;
          color:var(--body); margin:16px 0 20px; }
        .lp-plan-feats { list-style:none; margin:0 0 26px; padding:0; }
        .lp-plan-feats li { font-size:13.5px; line-height:1.5; color:var(--muted);
          padding:9px 0 9px 18px; border-top:1px solid var(--hair); position:relative; }
        .lp-plan-feats li::before { content:"—"; position:absolute; left:0; color:var(--accent); }
        .lp-plan-cta { margin-top:auto; }
        @media (max-width:860px){
          .lp-plans { grid-template-columns:1fr; }
          .lp-plan + .lp-plan { border-left:none; border-top:1px solid var(--rule); }
        }
        .lp-team { border-top:1px solid var(--rule); border-bottom:1px solid var(--rule);
          display:grid; grid-template-columns:1fr 1.6fr; gap:0 56px; padding:28px 0; }
        .lp-team-feats { list-style:none; margin:0; padding:0;
          columns:2; column-gap:36px; }
        .lp-team-feats li { font-size:13.5px; line-height:1.5; color:var(--muted);
          padding:8px 0 8px 18px; position:relative; break-inside:avoid; }
        .lp-team-feats li::before { content:"—"; position:absolute; left:0; color:var(--accent); }
        @media (max-width:860px){
          .lp-team { grid-template-columns:1fr; gap:22px; }
          .lp-team-feats { columns:1; }
        }

        /* --- FAQ ----------------------------------------------------------- */
        .lp-faq details { border-top:1px solid var(--hair); }
        .lp-faq details:first-child { border-top:1px solid var(--rule); }
        .lp-faq summary { cursor:pointer; list-style:none; display:flex; align-items:baseline;
          justify-content:space-between; gap:20px; padding:18px 0;
          font-family:var(--serif); font-size:20px; font-weight:400; letter-spacing:-.018em; }
        .lp-faq summary::-webkit-details-marker { display:none; }
        .lp-faq summary::after { content:"+"; font-family:var(--mono); font-size:15px;
          color:var(--accent); flex:none; }
        .lp-faq details[open] summary::after { content:"–"; }
        .lp-faq details p { margin:0; padding:0 0 22px; font-size:14.5px; line-height:1.68;
          color:var(--muted); max-width:70ch; }

        /* --- Closing band ---------------------------------------------------- */
        .lp-close { background:var(--ink); color:var(--paper); }
        .lp-close-inner { padding:84px 0 88px; display:grid; grid-template-columns:1.3fr 1fr;
          gap:0 56px; align-items:end; }
        .lp-close h2 { font-family:var(--serif); font-weight:400; font-size:clamp(34px,5.4vw,68px);
          line-height:.98; letter-spacing:-.032em; margin:0; text-wrap:balance; }
        .lp-close h2 em { font-style:italic; color:#8FD3B4; }
        .lp-close p { font-size:15px; line-height:1.65; color:#A8A99F; margin:0 0 22px; max-width:40ch; }
        .lp-close .btn-paper { background:var(--paper); color:var(--ink); border:1px solid var(--paper); }
        .lp-close .btn-paper:hover { background:#fff; border-color:#fff; }
        @media (max-width:860px){
          .lp-close-inner { grid-template-columns:1fr; gap:32px; padding:56px 0 60px; }
        }

        /* --- Colophon --------------------------------------------------------- */
        .lp-colo { display:grid; grid-template-columns:1.4fr 1fr 1fr; gap:36px;
          padding:44px 0 26px; }
        .lp-colo h4 { font-family:var(--mono); font-size:10.5px; letter-spacing:.16em;
          text-transform:uppercase; color:var(--faint); font-weight:500; margin:0 0 14px; }
        .lp-colo a { display:block; font-size:14px; color:var(--body); padding:5px 0; }
        .lp-colo a:hover { color:var(--accent); }
        .lp-colo-note { font-size:13.5px; line-height:1.6; color:var(--muted); max-width:38ch; margin:14px 0 0; }
        .lp-colo-base { border-top:1px solid var(--hair); padding:16px 0 34px;
          font-family:var(--mono); font-size:10.5px; letter-spacing:.12em; text-transform:uppercase;
          color:var(--faint); display:flex; flex-wrap:wrap; gap:10px 22px; }
        @media (max-width:760px){ .lp-colo { grid-template-columns:1fr 1fr; } }
        @media (max-width:480px){ .lp-colo { grid-template-columns:1fr; gap:26px; } }
      `}</style>

      {/* MASTHEAD */}
      <div className="lp-rule-accent" />
      <header className="lp-mast">
        <nav className="wrap lp-mast-inner">
          <Link href="/" className="lp-wordmark" aria-label="Prepa home">
            <Logo showWordmark={false} />
            <span>Prepa</span>
          </Link>
          <div className="lp-mast-nav">
            <a className="lp-mast-anchor" href="#how">How it works</a>
            <a className="lp-mast-anchor" href="#features">Features</a>
            <a className="lp-mast-anchor" href="#exams">Exams</a>
            <a className="lp-mast-anchor" href="#pricing">Pricing</a>
            <Link href="/login">Sign in</Link>
            <Link href="/signup" className="lp-mast-cta">Start free</Link>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="wrap lp-hero">
        <div className="lp-dateline">
          <span className="k">№ 01 — Certification prep</span>
          <span className="r">{PRESET_COUNT} exams · Free to start</span>
        </div>
        <h1 className="display">
          Pass your certification. <em>First try.</em>
        </h1>

        <div className="lp-hero-cols">
          <div className="lp-hero-left">
            <p className="deck">
              Prepa teaches your exam&apos;s full syllabus, drills you on the
              topics you keep getting wrong, and puts you in a real cloud
              console to build things yourself — then tells you when
              you&apos;re ready to book.
            </p>
            <div className="lp-hero-actions">
              <Link href="/signup" className="btn btn-accent">
                Start free — no card
              </Link>
              <a href="#how" className="btn btn-ghost">
                See how it works
              </a>
            </div>
            <p className="lp-hero-fine">
              30 practice questions, two lessons, a lab and a mock exam — free.
              {" "}{PRESET_COUNT} certifications, or bring your own notes.
            </p>

            <nav className="lp-toc" aria-label="Page contents">
              <span className="lp-toc-h">On this page</span>
              {contents.map((c) => (
                <a key={c.href} href={c.href} className="lp-toc-row">
                  <span className="n">{c.n}</span>
                  <span className="t">{c.t}</span>
                  <span className="lead" aria-hidden />
                  <span className="c">{c.c}</span>
                </a>
              ))}
            </nav>
          </div>

          {/* A real practice question as you'd actually see it — the product,
              with the verification stamp as supporting proof rather than the pitch. */}
          <figure className="lp-spec" style={{ margin: 0 }}>
            <figcaption className="lp-spec-head">
              <span>A question you&apos;d get</span>
              <span className="ok">AWS SAA-C03</span>
            </figcaption>
            <div className="lp-spec-body">
              <div className="lp-spec-src">Domain 3 · Databases</div>
              <p className="lp-spec-q">
                Which AWS service provides a fully managed NoSQL database with
                single-digit millisecond latency at any scale?
              </p>
              <div className="lp-spec-opt"><b>A</b><span>Amazon RDS</span></div>
              <div className="lp-spec-opt key">
                <b>B</b><span>Amazon DynamoDB</span>
                <span className="lp-spec-tick">Correct</span>
              </div>
              <div className="lp-spec-opt"><b>C</b><span>Amazon Redshift</span></div>
            </div>
            <div className="lp-spec-why">
              <div className="lp-spec-why-h">Why</div>
              <p>
                DynamoDB is AWS&apos;s managed NoSQL store, built for consistent
                single-digit-millisecond reads at any scale. RDS and Aurora are
                relational; Redshift is built for analytics, not low-latency
                lookups.
              </p>
              <span className="lp-spec-cite">↗ docs.aws.amazon.com</span>
            </div>
            <div className="lp-spec-ledger">
              <LedgerRow label="Answer" detail="confirmed by a second AI" value="Checked" />
              <LedgerRow label="Source" detail="docs.aws.amazon.com" value="Live" />
            </div>
          </figure>
        </div>
      </section>

      {/* FACTS */}
      <section className="wrap" aria-label="At a glance">
        <div className="lp-facts">
          {facts.map((f) => (
            <div key={f.l} className="lp-fact">
              <span className="n">{f.n}</span>
              <span className="l">{f.l}</span>
              <p className="p">{f.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="wrap lp-sec" style={{ scrollMarginTop: "80px" }}>
        <Folio n="№ 02" title="How it works" aside="From today to exam day" />
        <div className="lp-split">
          <div className="lp-split-label">
            <h2>Four steps. Nothing to buy first.</h2>
            <p>
              There&apos;s no question bank to purchase and no course to hunt
              down. Prepa builds the syllabus, the lessons, the labs and the
              questions around the exam you&apos;re actually sitting.
            </p>
            <p style={{ marginTop: "22px" }}>
              <Link href="/signup" className="btn btn-accent">Start free — no card</Link>
            </p>
          </div>
          <div className="lp-rows">
            {steps.map((s) => (
              <div key={s.n}>
                <span className="n">{s.n}</span>
                <div>
                  <h3>{s.h}</h3>
                  <p>{s.p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="wrap lp-sec" style={{ scrollMarginTop: "80px", paddingTop: 0 }}>
        <Folio n="№ 03" title="What you get" aside="Everything in one subscription" />
        <div className="lp-index">
          {features.map((f) => (
            <div key={f.k} className="lp-item">
              <div className="k">{f.k}</div>
              <h3>{f.h}</h3>
              <p>{f.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST */}
      <section id="trust" className="wrap lp-sec" style={{ scrollMarginTop: "80px" }}>
        <Folio n="№ 04" title="Why you can trust it" aside="How every answer is checked" />
        <div className="lp-split">
          <div className="lp-split-label">
            <h2>An AI wrote your questions. So we check them.</h2>
            <p>
              Nothing hurts your score like revising a wrong answer for a week.
              Three checks stand between a new question and your screen — and
              any one of them will throw it out.
            </p>
          </div>
          <div>
            <div className="lp-rows">
              {verifySteps.map((s) => (
                <div key={s.n}>
                  <span className="n">{s.n}</span>
                  <div>
                    <h3>{s.h}</h3>
                    <p>{s.p}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="prose" style={{ borderTop: "1px solid var(--hair)", paddingTop: "20px", marginTop: "0", maxWidth: "62ch" }}>
              Still think a question is wrong? Flag it. We re-check it
              independently, and if the check agrees with you it comes straight
              out of your review queue.
            </p>
          </div>
        </div>
      </section>

      {/* EXAMS */}
      <section id="exams" className="wrap lp-sec" style={{ scrollMarginTop: "80px", paddingTop: 0 }}>
        <Folio n="№ 05" title="Exams we cover" aside={`${PRESET_COUNT} certifications`} />
        <div className="lp-split">
          <div className="lp-split-label">
            <h2>Your exam, weighted like the real thing.</h2>
            <p>
              Domains and weightings come straight from each vendor&apos;s
              published outline, so you spend the most time where the exam puts
              the most marks. Sitting something that isn&apos;t listed? Describe
              it, or upload your notes, and Prepa builds the syllabus anyway.
            </p>
            <p style={{ marginTop: "16px" }}>
              <Link href="/exams" className="ulink">Read the free study guides →</Link>
            </p>
          </div>
          <div className="lp-cat">
            {providerGroups.map((group) => (
              <div key={group.provider} className="lp-cat-group">
                <div className="h">
                  <span>{PROVIDER_LABELS[group.provider]}</span>
                  <span>{group.presets.length}</span>
                </div>
                {group.presets.map((preset) => {
                  const slug = slugForExamCode(preset.examCode)
                  const inner = (
                    <>
                      <span className="t">{shortExamName(preset.exam)}</span>
                      <span className="lead" aria-hidden />
                      <span className="c">{preset.examCode}</span>
                    </>
                  )
                  return slug ? (
                    <Link key={preset.examCode} href={`/exams/${slug}`} className="lp-cat-row">
                      {inner}
                    </Link>
                  ) : (
                    <div key={preset.examCode} className="lp-cat-row">{inner}</div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VERSUS */}
      <section className="wrap lp-sec" style={{ paddingTop: 0 }}>
        <Folio n="№ 06" title="Compared with a question bank" aside="Why people switch" />
        <div className="lp-split">
          <div className="lp-split-label">
            <h2>Dumps ask you to trust them. Prepa shows its work.</h2>
            <p>
              A question bank sells you someone else&apos;s answers, frozen the
              day they were written. Here&apos;s what you get instead.
            </p>
          </div>
          <table className="lp-vs">
            <thead>
              <tr>
                <th>A question bank or dump</th>
                <th className="nu">Prepa</th>
              </tr>
            </thead>
            <tbody>
              {versus.map((v) => (
                <tr key={v.old}>
                  <td className="old">{v.old}</td>
                  <td className="nu">{v.nu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="wrap lp-sec" style={{ scrollMarginTop: "80px", paddingTop: 0 }}>
        <Folio n="№ 07" title="Pricing" aside="Cheaper than re-sitting" />
        <p className="lp-price-lead">
          Start free and see if it suits how you study. Upgrade when you book
          your exam date — a month of Pro costs a fraction of the exam fee, and
          you can cancel any time.
        </p>
        <div className="lp-plans">
          <div className="lp-plan">
            <div className="lp-plan-name"><span>{freePlan.name}</span></div>
            <div className="lp-plan-price">{freePlan.price}</div>
            {/* freePlan.cycle is "free", which just repeats the plan name here.
                The tagline already covers "no card", so don't say it twice. */}
            <div className="lp-plan-cycle">forever</div>
            <p className="lp-plan-tag">{freePlan.tagline}</p>
            <ul className="lp-plan-feats">
              {freePlan.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
            <div className="lp-plan-cta">
              <Link href="/signup" className="btn btn-ghost" style={{ display: "flex", width: "100%" }}>
                Start free
              </Link>
            </div>
          </div>

          <div className="lp-plan feat">
            <div className="lp-plan-name">
              <span>{proPlan.name}</span>
              <span className="rec">Recommended</span>
            </div>
            <div className="lp-plan-price">{proPlan.price}</div>
            <div className="lp-plan-cycle">
              per {proPlan.cycle} · or {PRO_ANNUAL_PRICE_LABEL}/year
            </div>
            <p className="lp-plan-tag">{proPlan.tagline}</p>
            <ul className="lp-plan-feats">
              {proPlan.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
            <div className="lp-plan-cta">
              <LandingProButton tier="pro" label="Get Pro" />
            </div>
          </div>

          <div className="lp-plan">
            <div className="lp-plan-name"><span>{examPassPlan.name}</span></div>
            <div className="lp-plan-price">{examPassPlan.price}</div>
            <div className="lp-plan-cycle">{examPassPlan.cycle}</div>
            <p className="lp-plan-tag">{examPassPlan.tagline}</p>
            <ul className="lp-plan-feats">
              {examPassPlan.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
            <div className="lp-plan-cta">
              <LandingProButton tier="exam_pass" label="Get Exam Pass" filled={false} />
            </div>
          </div>
        </div>

        <div className="lp-team">
          <div>
            <div className="lp-plan-name"><span>{TEAM_PLAN.name}</span></div>
            <div className="lp-plan-price">{TEAM_PLAN.price}</div>
            <div className="lp-plan-cycle">per {TEAM_PLAN.cycle}</div>
            <p className="lp-plan-tag">{TEAM_PLAN.tagline}</p>
            <Link href="/team" className="btn btn-ghost">Start a team</Link>
          </div>
          <ul className="lp-team-feats">
            {TEAM_PLAN.features.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="wrap lp-sec" style={{ scrollMarginTop: "80px", paddingTop: 0 }}>
        <Folio n="№ 08" title="Questions, answered" aside="Before you sign up" />
        <div className="lp-split">
          <div className="lp-split-label">
            <h2>What people ask before they start.</h2>
            <p>
              Anything still unclear? You can try the whole thing free before
              you decide — no card, nothing to cancel.
            </p>
          </div>
          <div className="lp-faq">
            {faqs.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING BAND */}
      <section className="lp-close">
        <div className="wrap lp-close-inner">
          <h2>
            Walk in knowing <em>you&apos;ll pass</em>.
          </h2>
          <div>
            <p>
              Set up takes under a minute. You get 30 practice questions, two
              lessons, a hands-on lab and a mock exam free — enough to know
              whether Prepa suits the way you study.
            </p>
            <Link href="/signup" className="btn btn-paper">
              Start free — no card
            </Link>
          </div>
        </div>
      </section>

      {/* COLOPHON */}
      <footer className="rule-top">
        <div className="wrap">
          <div className="lp-colo">
            <div>
              <Link href="/" className="lp-wordmark" aria-label="Prepa home">
                <Logo showWordmark={false} />
                <span>Prepa</span>
              </Link>
              <p className="lp-colo-note">
                Lessons, practice, hands-on labs and mock exams for {PRESET_COUNT}{" "}
                certifications — built to get you through first time.
              </p>
            </div>
            <div>
              <h4>Study</h4>
              <Link href="/exams">Exam guides</Link>
              <Link href="/blog">Blog</Link>
              <Link href="/team">For teams</Link>
              <Link href="/signup">Start free</Link>
            </div>
            <div>
              <h4>Company</h4>
              <Link href="/about">About</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/refund">Refund policy</Link>
            </div>
          </div>
          <div className="lp-colo-base">
            <span>© {new Date().getFullYear()} Prepa</span>
            <span>Set in Newsreader &amp; Spline Sans Mono</span>
            <Link href="/login" style={{ color: "inherit" }}>Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
