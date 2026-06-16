import { ExamConfig } from "@/components/exam/exam-config"
import { DailyLimitBanner } from "@/components/layout/daily-limit-banner"

export default function ExamPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Exam simulation
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Practice under real exam conditions — a fixed set of questions and a
          countdown timer that auto-submits when time runs out.
        </p>
      </header>

      <DailyLimitBanner />
      <ExamConfig />
    </div>
  )
}
