"use client"

import { AlarmClock, Flag, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ExamRulesProps {
  examCode: string
  examName: string
  questionCount: number
  durationMin: number
  passMark: number
  questionsReady: boolean
  isGenerating: boolean
  onStart: () => void
}

/** Pre-exam rules screen shown before the timer starts. */
export function ExamRules({
  examCode,
  examName,
  questionCount,
  durationMin,
  passMark,
  questionsReady,
  isGenerating,
  onStart,
}: ExamRulesProps) {
  const canStart = questionsReady

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-4 py-8">
      <header className="flex flex-col gap-1 text-center">
        <p className="text-sm font-medium text-primary">{examCode}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{examName}</h1>
        <p className="text-sm text-muted-foreground">Mock exam simulation</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="size-4" />
            Before you begin
          </CardTitle>
          <CardDescription>
            {questionCount} questions · {durationMin} minutes · pass mark{" "}
            {passMark}%
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <AlarmClock className="mt-0.5 size-4 shrink-0" />
            The timer starts when you click Start. It auto-submits when time runs
            out.
          </p>
          <p className="flex items-start gap-2">
            <Flag className="mt-0.5 size-4 shrink-0" />
            Use Flag for review on questions you want to revisit before submitting.
          </p>
          <p>
            Keyboard shortcuts: Alt+N or Alt+Right (next), Alt+P or Alt+Left
            (previous), Alt+F (flag).
          </p>
          <p>
            Questions are AI-generated practice items — not official exam
            content. You won&apos;t see scores or explanations until you submit.
          </p>
          {isGenerating && questionsReady && (
            <p>
              More questions are still loading in the background. You can begin
              now and new items will appear as you go.
            </p>
          )}
        </CardContent>
      </Card>

      <Button size="lg" disabled={!canStart} onClick={onStart}>
        {!questionsReady
          ? "Preparing first question…"
          : isGenerating
            ? "Start exam (more questions loading)"
            : "Start exam"}
      </Button>
    </div>
  )
}
