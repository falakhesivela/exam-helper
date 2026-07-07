// AI token metering. Fire-and-forget writes to the ai_usage table so cost
// tracking never blocks or breaks a generation request.

import { createAdminClient } from "@/lib/supabase/admin"

export interface AiUsageRow {
  userId?: string
  feature: string
  provider: string
  model: string
  inputTokens: number
  outputTokens: number
}

/**
 * Per-1M-token prices (USD) for read-time cost estimation. Keep in sync with
 * provider pricing pages; unknown models fall back to 0 (surfaces as untracked
 * rather than a wrong number). Verify rates before relying on cost dashboards.
 */
export const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  // xAI Grok
  "grok-4-1-fast": { input: 0.2, output: 0.5 },
  "grok-3-fast": { input: 0.2, output: 0.5 },
  // Google Gemini (OpenAI-compatible endpoint)
  "gemini-2.5-flash": { input: 0.3, output: 2.5 },
  "gemini-2.5-flash-lite": { input: 0.1, output: 0.4 },
  // OpenAI fallback
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
}

export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const price = MODEL_PRICES[model]
  if (!price) return 0
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000
}

/** Insert a usage row without awaiting — errors are logged, never thrown. */
export function recordAiUsage(row: AiUsageRow): void {
  void (async () => {
    try {
      const admin = createAdminClient()
      await admin.from("ai_usage").insert({
        user_id: row.userId ?? null,
        feature: row.feature,
        provider: row.provider,
        model: row.model,
        input_tokens: row.inputTokens,
        output_tokens: row.outputTokens,
      })
    } catch (err) {
      console.error("[ai_usage] insert failed:", err)
    }
  })()
}
