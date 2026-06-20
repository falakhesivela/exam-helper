import OpenAI from "openai"

const TIMEOUT_MS = 30_000

type Provider = "xai" | "openai"

function getClient(provider: Provider) {
  if (provider === "xai") {
    const apiKey = process.env.XAI_API_KEY
    if (!apiKey) return null
    return new OpenAI({
      apiKey,
      baseURL: "https://api.x.ai/v1",
      timeout: TIMEOUT_MS,
    })
  }
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  return new OpenAI({ apiKey, timeout: TIMEOUT_MS })
}

function getModel(provider: Provider) {
  return provider === "xai"
    ? (process.env.XAI_MODEL ?? "grok-3-fast")
    : (process.env.OPENAI_MODEL ?? "gpt-4o-mini")
}

export async function explainWrongAnswer(params: {
  prompt: string
  scenario?: string
  options: { id: string; text: string }[]
  correctOptionIds: string[]
  userSelectedIds: string[]
  explanation: string
}): Promise<string> {
  const correctTexts = params.options
    .filter((o) => params.correctOptionIds.includes(o.id))
    .map((o) => o.text)
  const userTexts = params.options
    .filter((o) => params.userSelectedIds.includes(o.id))
    .map((o) => o.text)

  const userMessage = [
    params.scenario ? `Scenario: ${params.scenario}` : "",
    `Question: ${params.prompt}`,
    `User chose: ${userTexts.join("; ") || "(none)"}`,
    `Correct answer(s): ${correctTexts.join("; ")}`,
    `Reference explanation: ${params.explanation}`,
    "",
    "In 2-4 short sentences, explain why the user's choice was wrong and how to recognize the right answer next time. Be encouraging and specific.",
  ]
    .filter(Boolean)
    .join("\n")

  const system =
    "You are CertForge, a concise certification exam tutor. Help the learner understand their mistake without repeating the full explanation verbatim."

  let lastError: unknown
  for (const provider of ["xai", "openai"] as Provider[]) {
    const client = getClient(provider)
    if (!client) continue
    try {
      const completion = await client.chat.completions.create({
        model: getModel(provider),
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMessage },
        ],
        max_tokens: 300,
      })
      const text = completion.choices[0]?.message?.content?.trim()
      if (text) return text
    } catch (err) {
      lastError = err
    }
  }

  throw lastError ?? new Error("AI tutor unavailable")
}
