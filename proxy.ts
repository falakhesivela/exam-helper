import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true"

export async function proxy(request: NextRequest) {
  if (USE_MOCKS || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.next()
  }
  return updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
