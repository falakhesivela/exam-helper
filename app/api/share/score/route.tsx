import { ImageResponse } from "next/og"

export const runtime = "nodejs"

const BG = "#0E1116"
const PRIMARY = "#2DD4A7"
const TEXT = "#E5E7EB"
const MUTED = "#9CA3AF"
const PASS = "#2DD4A7"
const FAIL = "#F87171"

/**
 * Branded, shareable score card (1200×630) for a completed mock exam. Driven by
 * query params (vanity image, no private data): code, exam, pct, pass, correct,
 * total. Doubles as a social-preview image.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = (searchParams.get("code") || "EXAM").slice(0, 16)
  const exam = (searchParams.get("exam") || "Certification Exam").slice(0, 64)
  const pct = Math.max(0, Math.min(100, Math.round(Number(searchParams.get("pct")) || 0)))
  const passed = searchParams.get("pass") === "1"
  const correct = Math.max(0, Math.round(Number(searchParams.get("correct")) || 0))
  const total = Math.max(0, Math.round(Number(searchParams.get("total")) || 0))
  const accent = passed ? PASS : FAIL

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BG,
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: PRIMARY,
              color: BG,
              fontSize: "36px",
              fontWeight: 700,
            }}
          >
            P
          </div>
          <div style={{ display: "flex", fontSize: "34px", fontWeight: 700 }}>
            <span style={{ color: TEXT }}>Prep</span>
            <span style={{ color: PRIMARY }}>a</span>
          </div>
        </div>

        {/* Score */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", color: MUTED, fontSize: "30px" }}>
            {code} mock exam
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "24px",
              marginTop: "8px",
            }}
          >
            <div style={{ display: "flex", color: accent, fontSize: "180px", fontWeight: 800, lineHeight: 1 }}>
              {pct}%
            </div>
            <div
              style={{
                display: "flex",
                marginBottom: "28px",
                padding: "10px 24px",
                borderRadius: "999px",
                background: passed ? "rgba(45,212,167,0.15)" : "rgba(248,113,113,0.15)",
                color: accent,
                fontSize: "34px",
                fontWeight: 700,
              }}
            >
              {passed ? "PASSED" : "KEEP GOING"}
            </div>
          </div>
          <div style={{ display: "flex", color: TEXT, fontSize: "32px", marginTop: "16px" }}>
            {correct} of {total} correct · {exam}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", color: MUTED, fontSize: "26px" }}>
          AI-powered certification exam prep
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
