import { ImageResponse } from "next/og"

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = "image/png"

const ACCENT = "#1E5C44"
const PAPER = "#F3EFE7"
const INK = "#1A1C18"

/**
 * Shared 1200x630 social card for the public marketing pages. Keeps exam hubs
 * and blog posts visually identical to the landing card, but with the page's
 * own title so shared links are distinguishable in feeds and search previews.
 */
export function renderOgImage({
  kicker,
  title,
  footer,
}: {
  kicker: string
  title: string
  footer: string
}) {
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
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
              fontSize: "22px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: ACCENT,
              fontWeight: 600,
              marginBottom: "20px",
            }}
          >
            {kicker}
          </div>
          <div
            style={{
              fontSize: title.length > 70 ? "50px" : "62px",
              fontWeight: 500,
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              maxWidth: "1000px",
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "24px",
            color: "#54564E",
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
          {footer}
        </div>
      </div>
    ),
    OG_SIZE,
  )
}
