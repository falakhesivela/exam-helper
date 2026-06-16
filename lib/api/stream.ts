import { ApiClientError } from "./client"

function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return "UTC"
  }
}

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
          const msg = (parsed as { message?: string }).message ?? "Stream error"
          throw new Error(msg)
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
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      "X-Timezone": getTimezone(),
    },
    credentials: "include",
    body: JSON.stringify(body),
    signal: handlers.signal,
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new ApiClientError(
      errBody.error ?? res.statusText,
      res.status,
      { code: errBody.code, remaining: errBody.remaining },
    )
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
