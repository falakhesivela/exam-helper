// Single AI client layer: provider factory, per-feature model routing,
// cross-provider failover, per-feature output caps, and token metering.
//
// Model routing is configured with per-feature env vars using `provider:model`
// syntax, e.g. AI_MODEL_TUTOR=gemini:gemini-2.5-flash. When unset, a feature
// falls back to the legacy global XAI_MODEL primary + OpenAI secondary, so an
// environment with no new vars behaves exactly as before.

import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { recordAiUsage } from "@/lib/db/ai-usage"

const GENERATION_TIMEOUT_MS = 60_000
const CHAT_TIMEOUT_MS = 30_000

export type AiProvider = "xai" | "openai" | "gemini"
export type AiFeature =
  | "generate"
  | "lesson"
  | "tutor"
  | "coach"
  | "clarify"
  | "verify"

/** Request context threaded through for metering. */
export interface AiContext {
  userId?: string
}

export interface Route {
  provider: AiProvider
  model: string
}

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/"

function xaiBaseUrl(): string {
  return process.env.XAI_BASE_URL?.trim() || "https://api.x.ai/v1"
}

function apiKeyFor(provider: AiProvider): string | undefined {
  switch (provider) {
    case "xai":
      return process.env.XAI_API_KEY
    case "openai":
      return process.env.OPENAI_API_KEY
    case "gemini":
      return process.env.GEMINI_API_KEY
  }
}

/** OpenAI-SDK client for a provider, or null if its key is unset. */
export function getClient(provider: AiProvider, timeoutMs: number): OpenAI | null {
  const apiKey = apiKeyFor(provider)
  if (!apiKey) return null
  switch (provider) {
    case "xai":
      return new OpenAI({ apiKey, baseURL: xaiBaseUrl(), timeout: timeoutMs })
    case "gemini":
      return new OpenAI({ apiKey, baseURL: GEMINI_BASE_URL, timeout: timeoutMs })
    case "openai":
      return new OpenAI({ apiKey, timeout: timeoutMs })
  }
}

/** Legacy per-provider default models (used when a feature env var is unset). */
function legacyModel(provider: AiProvider): string {
  switch (provider) {
    case "xai":
      return process.env.XAI_MODEL ?? "grok-4-1-fast"
    case "openai":
      return process.env.OPENAI_MODEL ?? "gpt-4o-mini"
    case "gemini":
      return process.env.GEMINI_MODEL ?? "gemini-2.5-flash"
  }
}

const FEATURE_ENV: Record<AiFeature, string> = {
  generate: "AI_MODEL_GENERATE",
  lesson: "AI_MODEL_LESSON",
  tutor: "AI_MODEL_TUTOR",
  coach: "AI_MODEL_COACH",
  clarify: "AI_MODEL_CLARIFY",
  verify: "AI_MODEL_VERIFY",
}

function parseRoute(spec: string): Route | null {
  const [provider, ...rest] = spec.split(":")
  const model = rest.join(":").trim()
  if (
    (provider === "xai" || provider === "openai" || provider === "gemini") &&
    model
  ) {
    return { provider, model }
  }
  return null
}

/**
 * Ordered routes to try for a feature: the configured primary first, then the
 * two other providers as fallbacks (using their legacy default models).
 */
export function resolveRoutes(feature: AiFeature): Route[] {
  const configured = process.env[FEATURE_ENV[feature]]?.trim()
  const primary = configured ? parseRoute(configured) : null

  // Verification defaults to a different provider than generation (Grok) so
  // the checker's mistakes don't correlate with the generator's.
  const defaultOrder: AiProvider[] =
    feature === "verify"
      ? ["gemini", "xai", "openai"]
      : ["xai", "openai", "gemini"]

  const order: AiProvider[] = primary
    ? [primary.provider, ...defaultOrder.filter((p) => p !== primary.provider)]
    : defaultOrder

  const routes: Route[] = []
  for (const provider of order) {
    const model =
      primary && provider === primary.provider ? primary.model : legacyModel(provider)
    routes.push({ provider, model })
  }
  return routes
}

/** Per-feature output cap. Generation is sized ~700 tokens/question by caller. */
const FEATURE_MAX_TOKENS: Record<AiFeature, number | undefined> = {
  generate: undefined, // caller passes an explicit cap sized to batch length
  lesson: 4000,
  tutor: 400,
  coach: 700,
  clarify: 600,
  verify: 2000, // blind answers are tiny: {index, optionIds} per question
}

export function maxTokensFor(feature: AiFeature, override?: number): number | undefined {
  return override ?? FEATURE_MAX_TOKENS[feature]
}

interface UsageLike {
  prompt_tokens?: number
  completion_tokens?: number
}

function meter(
  feature: AiFeature,
  ctx: AiContext,
  route: Route,
  usage: UsageLike | undefined,
): void {
  if (!usage) return
  recordAiUsage({
    userId: ctx.userId,
    feature,
    provider: route.provider,
    model: route.model,
    inputTokens: usage.prompt_tokens ?? 0,
    outputTokens: usage.completion_tokens ?? 0,
  })
}

/** Structured (JSON-schema) call with routing, failover, and metering. */
export async function callStructured<T>(
  feature: AiFeature,
  ctx: AiContext,
  system: string,
  user: string,
  schema: Parameters<typeof zodResponseFormat>[0],
  schemaName: string,
  opts?: { maxTokens?: number },
): Promise<T> {
  let lastError: unknown
  for (const route of resolveRoutes(feature)) {
    const client = getClient(route.provider, GENERATION_TIMEOUT_MS)
    if (!client) continue
    try {
      const completion = await client.chat.completions.parse({
        model: route.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: zodResponseFormat(schema, schemaName),
        max_tokens: maxTokensFor(feature, opts?.maxTokens),
      })
      meter(feature, ctx, route, completion.usage)
      const parsed = completion.choices[0]?.message?.parsed
      if (!parsed) throw new Error(`Empty ${schemaName} from ${route.provider}`)
      return parsed as T
    } catch (err) {
      lastError = err
      console.warn(`[ai] ${route.provider}/${route.model} failed:`, err)
    }
  }
  throw lastError ?? new Error(`All AI providers failed for ${feature}`)
}

/** Streaming structured call. `stream_options.include_usage` yields token usage. */
export async function streamStructured<T>(
  feature: AiFeature,
  ctx: AiContext,
  system: string,
  user: string,
  schema: Parameters<typeof zodResponseFormat>[0],
  schemaName: string,
  onDelta: (parsed: Partial<T> | null) => void,
  opts?: { maxTokens?: number },
): Promise<T> {
  let lastError: unknown
  for (const route of resolveRoutes(feature)) {
    const client = getClient(route.provider, GENERATION_TIMEOUT_MS)
    if (!client) continue
    try {
      const completionStream = client.chat.completions.stream({
        model: route.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: zodResponseFormat(schema, schemaName),
        max_tokens: maxTokensFor(feature, opts?.maxTokens),
        stream: true,
        stream_options: { include_usage: true },
      })
      completionStream.on("content.delta", (event) => {
        onDelta(event.parsed as Partial<T> | null)
      })
      const completion = await completionStream.finalChatCompletion()
      meter(feature, ctx, route, completion.usage)
      const parsed = completion.choices[0]?.message?.parsed
      if (!parsed) throw new Error(`Empty ${schemaName} from ${route.provider}`)
      return parsed as T
    } catch (err) {
      lastError = err
      console.warn(`[ai:stream] ${route.provider}/${route.model} failed:`, err)
    }
  }
  throw lastError ?? new Error(`All AI providers failed for ${feature}`)
}

export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

/** Plain chat completion (tutor). */
export async function callChat(
  feature: AiFeature,
  ctx: AiContext,
  messages: ChatMessage[],
  opts?: { maxTokens?: number },
): Promise<string> {
  let lastError: unknown
  for (const route of resolveRoutes(feature)) {
    const client = getClient(route.provider, CHAT_TIMEOUT_MS)
    if (!client) continue
    try {
      const completion = await client.chat.completions.create({
        model: route.model,
        messages,
        max_tokens: maxTokensFor(feature, opts?.maxTokens),
      })
      meter(feature, ctx, route, completion.usage)
      const text = completion.choices[0]?.message?.content?.trim()
      if (text) return text
    } catch (err) {
      lastError = err
    }
  }
  throw lastError ?? new Error(`AI ${feature} unavailable`)
}

/**
 * Streaming chat completion (tutor). Falls back to the next provider only when
 * nothing has streamed yet — a partial reply can't be restarted cleanly.
 */
export async function streamChat(
  feature: AiFeature,
  ctx: AiContext,
  messages: ChatMessage[],
  onDelta: (text: string) => void,
  opts?: { maxTokens?: number },
): Promise<string> {
  let lastError: unknown
  for (const route of resolveRoutes(feature)) {
    const client = getClient(route.provider, CHAT_TIMEOUT_MS)
    if (!client) continue
    let emitted = ""
    try {
      const stream = await client.chat.completions.create({
        model: route.model,
        messages,
        max_tokens: maxTokensFor(feature, opts?.maxTokens),
        stream: true,
        stream_options: { include_usage: true },
      })
      let usage: UsageLike | undefined
      for await (const chunk of stream) {
        if (chunk.usage) usage = chunk.usage
        const delta = chunk.choices[0]?.delta?.content ?? ""
        if (delta) {
          emitted += delta
          onDelta(delta)
        }
      }
      meter(feature, ctx, route, usage)
      const text = emitted.trim()
      if (text) return text
    } catch (err) {
      lastError = err
      if (emitted) throw err
    }
  }
  throw lastError ?? new Error(`AI ${feature} unavailable`)
}
