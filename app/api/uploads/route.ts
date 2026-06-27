import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/route-utils"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 },
      )
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 5 MB limit" },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    // pdf-parse v2 exposes a PDFParse class (the v1 default-function API is gone).
    const { PDFParse } = await import("pdf-parse")
    const parser = new PDFParse({ data: new Uint8Array(buffer) })
    let extractedText: string
    try {
      const result = await parser.getText()
      extractedText = (result.text ?? "").slice(0, 50_000)
    } finally {
      await parser.destroy().catch(() => {})
    }

    const admin = createAdminClient()
    const uploadId = crypto.randomUUID()
    const storagePath = `${user.id}/${uploadId}.pdf`

    const { error: storageError } = await admin.storage
      .from("uploads")
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      })

    if (storageError) {
      console.warn("[uploads] storage error:", storageError.message)
    }

    const { data, error } = await admin
      .from("uploads")
      .insert({
        id: uploadId,
        user_id: user.id,
        storage_path: storagePath,
        extracted_text: extractedText,
      })
      .select("id")
      .single()

    if (error) throw error

    return NextResponse.json({ fileId: data.id })
  } catch (err) {
    return handleRouteError(err)
  }
}
