import Link from "next/link"
import {
  AlarmClock,
  BookOpen,
  Check,
  Flame,
  Sparkles,
  Zap,
} from "lucide-react"
import { Logo } from "@/components/layout/logo"
import { Button } from "@/components/ui/button"
import { FREE_PLAN, PRO_PLAN } from "@/lib/config/pricing"
import { LEGAL_LINKS } from "@/app/(legal)/legal-config"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: Sparkles,
    title: "Fresh AI questions",
    body: "Every session generates new, exam-style multiple-choice questions tailored to your weak areas — never the same drill twice.",
  },
  {
    icon: Zap,
    title: "Instant explanations",
    body: "Get a clear explanation the moment you answer, so you learn from every mistake instead of just seeing a score.",
  },
  {
    icon: Flame,
    title: "Progress & streaks",
    body: "Track mastery by topic, build a daily streak, and watch your readiness climb toward exam day.",
  },
  {
    icon: AlarmClock,
    title: "Full mock exams",
    body: "Practise under realistic timed conditions with mock exams that mirror the real certification format.",
  },
]

const plans = [
  { ...FREE_PLAN, highlighted: false, cta: { label: "Start free", href: "/dashboard" } },
  { ...PRO_PLAN, highlighted: true, cta: { label: "Upgrade to Pro", href: "/upgrade" } },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            AI-powered exam prep
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Pass your certification exam with practice that adapts to you
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
            Prepa generates fresh, tailored questions for high-stakes
            certification exams — with instant feedback, mock exams, and progress
            tracking. Start practising in seconds, no sign-up required.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/dashboard">
                <Sparkles data-icon="inline-start" />
                Start practising free
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/upgrade">See pricing</Link>
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            20 free questions every day · upgrade anytime
          </p>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-card/30">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <div className="grid gap-6 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-border bg-background p-6"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground text-pretty">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="mx-auto max-w-3xl px-6 py-20">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Simple pricing
            </h2>
            <p className="text-muted-foreground">
              Start free. Go unlimited when you&apos;re serious. Cancel anytime.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {plans.map((plan) => (
              <section
                key={plan.name}
                className={cn(
                  "flex flex-col gap-5 rounded-2xl border p-6",
                  plan.highlighted
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card",
                )}
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="flex items-baseline gap-1">
                    <span className="text-3xl font-semibold tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /{plan.cycle}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground text-pretty">
                    {plan.tagline}
                  </p>
                </div>

                <ul className="flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  <Link href={plan.cta.href}>{plan.cta.label}</Link>
                </Button>
              </section>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-border bg-card/30">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center">
            <BookOpen className="mx-auto size-8 text-primary" />
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">
              Ready to start studying smarter?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              Jump straight in — no account needed. Sign up later to save your
              progress across devices.
            </p>
            <Button size="lg" className="mt-6" asChild>
              <Link href="/dashboard">Start practising free</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Prepa</span>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="underline-offset-4 hover:text-foreground hover:underline"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
