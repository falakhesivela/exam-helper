import type { Question } from "@/types"
import { Markdown, MarkdownInline } from "@/components/ui/markdown"
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
        <Markdown className="mb-4 rounded-md border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
          {scenario}
        </Markdown>
      )}
      <h1 className="text-balance text-lg font-medium leading-relaxed sm:text-xl">
        <MarkdownInline>{question.prompt}</MarkdownInline>
      </h1>
    </div>
  )
}
