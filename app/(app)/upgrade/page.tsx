import type { Metadata } from "next"
import Link from "next/link"
import { Check } from "lucide-react"
import { SubscribeButton } from "@/components/upgrade/subscribe-button"
import { PLANS, PRO_ANNUAL_PRICE_LABEL } from "@/lib/config/pricing"
import { LEGAL_LINKS } from "@/app/(legal)/legal-config"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Upgrade your plan",
  description: "Pick the plan that fits your exam timeline.",
}

export default function UpgradePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Choose your plan
        </h1>
        <p className="text-muted-foreground text-pretty">
          Practise as much as you need. Cancel anytime.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <section
            key={plan.tier}
            className={cn(
              "flex flex-col gap-5 rounded-2xl border p-6",
              plan.featured
                ? "border-primary bg-primary/5"
                : "border-border bg-card",
            )}
          >
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{plan.name}</h2>
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

            {plan.tier === "pro" && (
              <div className="flex flex-col gap-2">
                <SubscribeButton tier="pro" />
                <SubscribeButton
                  tier="pro_annual"
                  variant="ghost"
                  label={`or ${PRO_ANNUAL_PRICE_LABEL}/year — save 45%`}
                />
              </div>
            )}
            {plan.tier === "exam_pass" && (
              <SubscribeButton tier="exam_pass" variant="outline" />
            )}
          </section>
        ))}
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Payments handled securely by Paddle.</span>
        {LEGAL_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            {link.label}
          </Link>
        ))}
      </footer>
    </div>
  )
}
