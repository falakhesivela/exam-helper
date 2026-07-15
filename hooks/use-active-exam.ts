"use client"

import { useMemo } from "react"
import { getExamBlueprint, type ExamBlueprint } from "@/lib/exams"
import { inferExamFromSessions } from "@/lib/learning/topic-resolver"
import { useSessionStore } from "@/lib/store/use-session-store"
import type { UserExam } from "@/types"

export interface ActiveExam {
  examCode: string
  exam: string
  /** null for custom exams that have no preset blueprint. */
  blueprint: ExamBlueprint | null
  examDate: string | null
}

interface ActiveExamResult {
  /** null only when we genuinely don't know the exam yet. */
  activeExam: ActiveExam | null
  userExams: UserExam[]
  /** False while the store is still hydrating — render skeletons, not an empty state. */
  ready: boolean
}

/**
 * The exam that launch flows run against. Resolved from the profile (which the
 * server scopes last-practiced-wins) and changed from the exam switcher — never
 * re-asked on the pages that start a session.
 *
 * Onboarding can be skipped, so a user may have no exams at all; callers show a
 * one-time picker for that case rather than guessing an exam for them.
 */
export function useActiveExam(): ActiveExamResult {
  const activeExamCode = useSessionStore((s) => s.activeExamCode)
  const userExams = useSessionStore((s) => s.userExams)
  const sessions = useSessionStore((s) => s.sessions)
  const dataReady = useSessionStore((s) => s.dataReady)

  const activeExam = useMemo<ActiveExam | null>(() => {
    const chosen =
      userExams.find((e) => e.examCode === activeExamCode) ?? userExams[0]
    if (chosen) {
      return {
        examCode: chosen.examCode,
        exam: chosen.exam,
        blueprint: getExamBlueprint(chosen.examCode) ?? null,
        examDate: chosen.examDate,
      }
    }

    // Onboarding was skipped but the user has practiced: follow their history
    // rather than making them pick an exam they've already been answering.
    if (sessions.length === 0) return null
    const inferred = inferExamFromSessions(sessions)
    if (inferred.examCode === "CUSTOM" && !activeExamCode) return null
    const code = activeExamCode ?? inferred.examCode
    const blueprint = getExamBlueprint(code) ?? null
    return {
      examCode: code,
      exam: blueprint?.exam ?? inferred.exam,
      blueprint,
      examDate: null,
    }
  }, [activeExamCode, userExams, sessions])

  return { activeExam, userExams, ready: dataReady }
}
