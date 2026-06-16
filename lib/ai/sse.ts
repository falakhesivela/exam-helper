/** Server-side SSE helpers for streaming AI progress to the browser. */

export type SseSend = (event: string, data: unknown) => void

export function createEventStream(
  handler: (send: SseSend) => Promise<void>,
): Response {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send: SseSend = (event, data) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        )
      }

      try {
        await handler(send)
      } catch (err) {
        send("error", {
          message: err instanceof Error ? err.message : "Unknown error",
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
