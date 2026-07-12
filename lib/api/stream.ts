"use client"

import { ApiClientError } from "./client"
import { buildApiFetchInit } from "./fetch-init"

export interface SseHandlers<TDone> {
  onStatus?: (message: string) => void
  onEvent?: (event: string, data: unknown) => void
  onReady?: (data: unknown) => void
  onDone?: (data: TDone) => void
}

export interface ConsumeSseOptions<TDone> extends SseHandlers<TDone> {
  signal?: AbortSignal
}

async function readSseStream<TDone>(
  res: Response,
  handlers: ConsumeSseOptions<TDone>,
): Promise<TDone> {
  const reader = res.body?.getReader()
  if (!reader) throw new Error("No response stream")

  const decoder = new TextDecoder()
  let buffer = ""
  let doneData: TDone | undefined

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    let boundary = buffer.indexOf("\n\n")
    while (boundary !== -1) {
      const raw = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)

      let event = "message"
      let data = ""

      for (const line of raw.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim()
        else if (line.startsWith("data:")) data = line.slice(5).trim()
      }

      if (data) {
        const parsed = JSON.parse(data) as unknown
        handlers.onEvent?.(event, parsed)

        if (event === "status") {
          const msg = (parsed as { message?: string }).message
          if (msg) handlers.onStatus?.(msg)
        } else if (event === "ready") {
          handlers.onReady?.(parsed)
        } else if (event === "error") {
          const { message, code, remaining, feature, upgradeTier } = parsed as {
            message?: string
            code?: string
            remaining?: number
            feature?: string
            upgradeTier?: string
          }
          // Mid-stream errors arrive over a 200 response; surface app error
          // codes (quota limits etc.) the same way non-200 JSON errors do.
          if (code)
            throw new ApiClientError(message ?? "Stream error", 402, {
              code,
              remaining,
              feature,
              upgradeTier,
            })
          throw new Error(message ?? "Stream error")
        } else if (event === "done") {
          doneData = parsed as TDone
          handlers.onDone?.(doneData)
        }
      }

      boundary = buffer.indexOf("\n\n")
    }
  }

  if (doneData === undefined) {
    throw new Error("Stream ended without a done event")
  }

  return doneData
}

/** Consume a POST endpoint that responds with Server-Sent Events. */
export async function consumeSse<TDone>(
  path: string,
  body: unknown,
  handlers: ConsumeSseOptions<TDone> = {},
): Promise<TDone> {
  const { url, init: fetchInit } = await buildApiFetchInit(path, {
    method: "POST",
    headers: { Accept: "text/event-stream" },
    body: JSON.stringify(body),
    signal: handlers.signal,
  })
  const res = await fetch(url, fetchInit)

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new ApiClientError(errBody.error ?? res.statusText, res.status, {
      code: errBody.code,
      remaining: errBody.remaining,
      feature: errBody.feature,
      upgradeTier: errBody.upgradeTier,
    })
  }

  return readSseStream(res, handlers)
}

/** Start SSE consumption without awaiting completion (for background generation). */
export function startSseStream<TDone>(
  path: string,
  body: unknown,
  handlers: ConsumeSseOptions<TDone>,
): { promise: Promise<TDone>; abort: () => void } {
  const controller = new AbortController()
  const promise = consumeSse<TDone>(path, body, {
    ...handlers,
    signal: controller.signal,
  })
  return {
    promise,
    abort: () => controller.abort(),
  }
}
