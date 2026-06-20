import type { Question } from "@/types"
import { hasScenario } from "@/lib/question-stem"

interface QuestionStemProps {
  question: Question
  className?: string
}

export function QuestionStem({ question, className }: QuestionStemProps) {
  const scenario = hasScenario(question) ? question.scenario!.trim() : null

  return (
    <div className={className}>
      {scenario && (
        <div className="mb-4 rounded-md border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
          {scenario}
        </div>
      )}
      <h1 className="text-balance text-lg font-medium leading-relaxed sm:text-xl">
        {question.prompt}
      </h1>
    </div>
  )
}
