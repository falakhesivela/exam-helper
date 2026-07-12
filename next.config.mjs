import { withSerwist } from "@serwist/turbopack"

function apiBackendUrl() {
  return (
    process.env.API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://127.0.0.1:8000"
  ).replace(/\/$/, "")
}

function apiCorsHeaders() {
  const allowed =
    process.env.ALLOWED_ORIGIN?.split(",")[0]?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (!allowed) return []

  return [
    {
      source: "/api/:path*",
      headers: [
        { key: "Access-Control-Allow-Origin", value: allowed },
        {
          key: "Access-Control-Allow-Headers",
          value: "Content-Type, Authorization, X-Timezone, Accept",
        },
        {
          key: "Access-Control-Allow-Methods",
          value: "GET, POST, PATCH, PUT, DELETE, OPTIONS",
        },
      ],
    },
  ]
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["pdf-parse", "esbuild"],
  async headers() {
    return apiCorsHeaders()
  },
  async rewrites() {
    const backend = apiBackendUrl()
    return [
      {
        // Local route app/api/share/score wins over this rewrite.
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
    ]
  },
  /**
   * Learn and Practice merged into one Study area. These keep old bookmarks,
   * installed-PWA shortcuts and shared links working.
   *
   * Not permanent: a 308 is cached by the browser forever, which is
   * unrecoverable if any of these turn out to be wrong.
   *
   * Next preserves the incoming query string, so ?planTask= and ?due= survive.
   */
  async redirects() {
    return [
      // Must precede /learn/:slug, or "facts" is read as a topic slug.
      { source: "/learn/facts", destination: "/study/review?source=facts", permanent: false },
      { source: "/learn/:slug/lab", destination: "/study/:slug/lab", permanent: false },
      { source: "/learn/:slug", destination: "/study/:slug", permanent: false },
      { source: "/learn", destination: "/study", permanent: false },

      { source: "/practice/missed", destination: "/study/review?mode=quiz", permanent: false },
      { source: "/practice/flashcards", destination: "/study/review?source=questions", permanent: false },
      { source: "/practice/bookmarks", destination: "/study/saved", permanent: false },
      { source: "/practice", destination: "/study", permanent: false },
    ]
  },
}

export default withSerwist(nextConfig)
