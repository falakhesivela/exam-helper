import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { FreemiumExceededError, LessonLimitExceededError } from "@/lib/db/usage"

export interface ApiErrorBody {
  error: string
  code?: string
  details?: unknown
  remaining?: number
}

export function apiError(
  message: string,
  status: number,
  extra?: Partial<ApiErrorBody>,
) {
  return NextResponse.json(
    { error: message, ...extra } satisfies ApiErrorBody,
    { status },
  )
}

export function handleRouteError(err: unknown) {
  if (err instanceof ZodError) {
    return apiError("Validation failed", 400, {
      code: "VALIDATION_ERROR",
      details: err.flatten(),
    })
  }
  if (err instanceof FreemiumExceededError) {
    return apiError(err.message, 402, {
      code: err.code,
      remaining: err.remaining,
    })
  }
  if (err instanceof LessonLimitExceededError) {
    return apiError(err.message, 402, {
      code: err.code,
      remaining: err.remaining,
    })
  }
  if (err instanceof Error && err.message === "Unauthorized") {
    return apiError("Unauthorized", 401, { code: "UNAUTHORIZED" })
  }
  console.error("[api]", err)
  return apiError("Internal server error", 500, { code: "INTERNAL_ERROR" })
}

export function getTimezone(request: Request): string {
  return request.headers.get("x-timezone") ?? "UTC"
}
