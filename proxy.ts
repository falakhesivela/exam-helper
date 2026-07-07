import { type NextRequest, NextResponse } from "next/server"
import { corsHeadersForRequest } from "@/lib/api/cors"
import { updateSession } from "@/lib/supabase/middleware"

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true"

export async function proxy(request: NextRequest) {
  const isApi = request.nextUrl.pathname.startsWith("/api/")
  const cors = isApi ? corsHeadersForRequest(request) : {}

  if (isApi && request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: cors,
    })
  }

  const response =
    USE_MOCKS || !process.env.NEXT_PUBLIC_SUPABASE_URL
      ? NextResponse.next()
      : await updateSession(request)

  for (const [key, value] of Object.entries(cors)) {
    response.headers.set(key, value)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|serwist|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
