import { ImageResponse } from "next/og"

export const alt =
  "Prepa — AI-powered practice questions for certification exams"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const ACCENT = "#1E5C44"
const PAPER = "#F3EFE7"
const INK = "#1A1C18"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          color: INK,
          padding: "72px 80px",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: ACCENT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            P
          </div>
          <div style={{ fontSize: "36px", fontWeight: 600 }}>Prepa</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: "64px",
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxWidth: "900px",
            }}
          >
            Pass your certification exam with practice that adapts to you
          </div>
          <div
            style={{
              marginTop: "28px",
              fontSize: "28px",
              color: "#54564E",
              maxWidth: "860px",
              lineHeight: 1.4,
            }}
          >
            Fresh AI questions, instant explanations, timed mock exams, and
            progress tracking.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "24px",
            color: ACCENT,
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: ACCENT,
            }}
          />
          AWS · Azure · CompTIA · PMP · CISSP · CFA · ITIL — start free
        </div>
      </div>
    ),
    size
  )
}
