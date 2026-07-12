"use client"

import Link from "next/link"
import { Home, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PracticeSession } from "@/types"
import {
  confidenceBreakdown,
  domainBreakdown,
  paceReport,
  scoreOf,
  weakestDomains,
} from "@/lib/session-utils"
import { getExamBlueprint } from "@/lib/exams"
import { ShareScoreCard } from "@/components/exam/share-score-card"
import { ScoreHero } from "@/components/exam/debrief/score-hero"
import { DomainReport } from "@/components/exam/debrief/domain-report"
import { TimeReport } from "@/components/exam/debrief/time-report"
import { ConfidenceMatrix } from "@/components/exam/debrief/confidence-matrix"
import { NextActions } from "@/components/exam/debrief/next-actions"
import { QuestionRecap } from "@/components/exam/debrief/question-recap"
import { AiDebrief } from "@/components/exam/debrief/ai-debrief"

interface ExamSummaryProps {
  session: PracticeSession
  timeUsedSec: number
}

/**
 * Post-exam debrief: verdict, weak-domain drill, pacing and confidence
 * analysis, and concrete next actions — built to turn one mock exam into a
 * study plan, not just a score.
 */
export function ExamSummary({ session, timeUsedSec }: ExamSummaryProps) {
  const { correct, total, pct, answered, skipped } = scoreOf(session)
  const blueprint = getExamBlueprint(session.examCode)
  const breakdown = domainBreakdown(session, blueprint)
  const passMark = session.passMark ?? 72
  const passed = pct >= passMark
  const pace = paceReport(session)
  const confidence = confidenceBreakdown(session)
  const weakest = weakestDomains(breakdown, passMark)
  const missedCount = Math.max(0, answered - correct) + skipped

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
      <ScoreHero
        examCode={session.examCode}
        pct={pct}
        correct={correct}
        total={total}
        passMark={passMark}
        timeUsedSec={session.timeUsedSec ?? timeUsedSec}
        durationSec={session.durationSec}
      />

      <AiDebrief sessionId={session.id} />

      <DomainReport
        exam={session.exam}
        examCode={session.examCode}
        breakdown={breakdown}
        passMark={passMark}
      />

      <ConfidenceMatrix breakdown={confidence} sessionId={session.id} />

      {pace && <TimeReport report={pace} />}

      <NextActions
        sessionId={session.id}
        missedCount={missedCount}
        weakest={weakest}
      />

      <QuestionRecap session={session} />

      <ShareScoreCard
        examCode={session.examCode}
        exam={session.exam}
        pct={pct}
        correct={correct}
        total={total}
        passed={passed}
      />

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Button asChild size="lg" className="flex-1">
          <Link href="/exam">
            <RotateCcw data-icon="inline-start" />
            New exam
          </Link>
        </Button>
        <Button asChild size="lg" variant="secondary" className="flex-1">
          <Link href={`/history/${session.id}`}>Review answers</Link>
        </Button>
        <Button asChild size="lg" variant="ghost" className="flex-1">
          <Link href="/dashboard">
            <Home data-icon="inline-start" />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
