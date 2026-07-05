"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { StudyPlan, StudyPlanTask } from "@/types"
import { getExamBlueprint, scaledExamParams } from "@/lib/exams"
import { resolveTopicName } from "@/lib/learning/topic-resolver"
import { useGenerationStore } from "@/lib/generation/session-generation"
import { useSessionStore } from "@/lib/store/use-session-store"
import { ApiClientError } from "@/lib/api/client"

/**
 * Launch a study-plan task through the existing generation/navigation flows,
 * then mark it done. Practice/exam tasks generate a session; lesson/review
 * tasks just navigate.
 */
export function useTaskLauncher(plan: StudyPlan | null) {
  const router = useRouter()
  const hydrate = useSessionStore((s) => s.hydrate)
  const updatePlanTask = useSessionStore((s) => s.updatePlanTask)
  const [launchingId, setLaunchingId] = useState<string | null>(null)

  function launch(task: StudyPlanTask) {
    if (!plan || launchingId) return

    if (task.type === "lesson" && task.domainName) {
      const { slug } = resolveTopicName(task.domainName, plan.examCode)
      void updatePlanTask(task.id, "done")
      router.push(`/learn/${slug}`)
      return
    }
    if (task.type === "review") {
      void updatePlanTask(task.id, "done")
      router.push("/practice/missed")
      return
    }

    const blueprint = getExamBlueprint(plan.examCode)
    if (!blueprint) {
      toast.error("This exam isn't available for generation.")
      return
    }
    setLaunchingId(task.id)

    if (task.type === "exam") {
      const scaled = scaledExamParams(blueprint, task.questionCount)
      useGenerationStore.getState().startExamGeneration(
        {
          questionCount: scaled.questionCount,
          durationSec: scaled.durationMin * 60,
          exam: plan.exam,
          examCode: plan.examCode,
          focusDomainIds: [],
        },
        {
          onReady: (session) => {
            void updatePlanTask(task.id, "done")
            toast.success("Mock exam ready!")
            router.push(`/exam/${session.id}`)
            setLaunchingId(null)
          },
          onDone: async () => {
            await hydrate()
          },
          onError: (err) => {
            toast.error(
              err instanceof ApiClientError && err.code === "FREEMIUM_LIMIT"
                ? "Daily question limit reached."
                : err.message,
            )
            setLaunchingId(null)
          },
        },
      )
      return
    }

    // practice
    const domain = task.domainName ?? "your weak areas"
    useGenerationStore.getState().startPracticeGeneration(
      {
        description: `Focused practice for ${plan.exam} (${plan.examCode}). Target this domain: ${domain}. Generate exam-style multiple-choice questions on it only.`,
        count: task.questionCount,
        focusTopics: task.domainName ? [task.domainName] : [],
        exam: plan.exam,
        examCode: plan.examCode,
      },
      {
        onReady: (session) => {
          void updatePlanTask(task.id, "done")
          toast.success("Practice ready!")
          router.push(`/quiz/${session.id}`)
          setLaunchingId(null)
        },
        onDone: async () => {
          await hydrate()
        },
        onError: (err) => {
          toast.error(
            err instanceof ApiClientError && err.code === "FREEMIUM_LIMIT"
              ? "Daily question limit reached."
              : err.message,
          )
          setLaunchingId(null)
        },
      },
    )
  }

  return { launch, launchingId }
}
