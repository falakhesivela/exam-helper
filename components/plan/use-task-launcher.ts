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
 * Launch a study-plan task through the existing generation/navigation flows.
 * The task is NOT marked done here — practice/exam sessions carry the task id
 * (`planTaskId`) and the server completes the task when the session is actually
 * finished; lesson/review pages get it as a `planTask` query param and mark it
 * done client-side on completion.
 */
export function useTaskLauncher(plan: StudyPlan | null) {
  const router = useRouter()
  const hydrate = useSessionStore((s) => s.hydrate)
  const [launchingId, setLaunchingId] = useState<string | null>(null)

  function launch(task: StudyPlanTask) {
    if (!plan || launchingId) return

    if (task.type === "lesson") {
      // Fall back to the title ("Learn: <domain>") when domainName is absent so
      // a lesson never silently turns into a practice run.
      const topicName =
        task.domainName ?? task.title.replace(/^Learn:\s*/i, "").trim()
      if (!topicName) {
        toast.info("Pick the matching topic to study.")
        router.push("/study")
        return
      }
      const { slug } = resolveTopicName(topicName, plan.examCode)
      router.push(`/study/${slug}?planTask=${task.id}`)
      return
    }
    if (task.type === "review") {
      router.push(`/study/review?mode=quiz&planTask=${task.id}`)
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
          planTaskId: task.id,
        },
        {
          onReady: (session) => {
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
                ? "Question limit reached on your plan."
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
        planTaskId: task.id,
      },
      {
        onReady: (session) => {
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
              ? "Question limit reached on your plan."
              : err.message,
          )
          setLaunchingId(null)
        },
      },
    )
  }

  return { launch, launchingId }
}
