import { IntakeForm } from "@/components/intake/intake-form"
import { DailyLimitBanner } from "@/components/layout/daily-limit-banner"

export default async function IntakePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; exam?: string }>
}) {
  const { topic, exam } = await searchParams

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {topic ? "Practice this topic" : "New practice session"}
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          {topic
            ? `Focused practice on ${decodeURIComponent(topic)}. Adjust the description if needed, then generate questions.`
            : "Describe your exam in your own words. CertForge will ask a couple of clarifying questions, then generate fresh questions tailored to you."}
        </p>
      </header>

      <DailyLimitBanner />
      <IntakeForm
        initialTopic={topic ? decodeURIComponent(topic) : undefined}
        initialExamCode={exam ? decodeURIComponent(exam) : undefined}
      />
    </div>
  )
}
