import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { loadBookmarkIds } from "@/lib/db/bookmarks"

export const runtime = "nodejs"

/** GET — just the saved question ids, for lighting up the save toggle. */
export async function GET() {
  try {
    const user = await requireUser()
    const admin = createAdminClient()
    const ids = await loadBookmarkIds(admin, user.id)
    return NextResponse.json({ ids })
  } catch (err) {
    return handleRouteError(err)
  }
}
