import { HistoryList } from "@/components/history/history-list"
import { ScoreTrend } from "@/components/history/score-trend"

export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="text-sm text-muted-foreground">
          Review your past sessions, scores, and explanations.
        </p>
      </header>
      <ScoreTrend />
      <HistoryList />
    </div>
  )
}
