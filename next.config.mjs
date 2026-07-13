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
      // Keep the mature Study route implementations behind the newly
      // separated Learn and Practice URLs.
      { source: "/learn/:topicSlug/lab", destination: "/study/:topicSlug/lab" },
      { source: "/learn/:topicSlug/drill", destination: "/study/:topicSlug/drill" },
      { source: "/learn/:topicSlug/review", destination: "/study/:topicSlug/review" },
      { source: "/learn/:topicSlug", destination: "/study/:topicSlug" },
      { source: "/practice/review", destination: "/study/review" },
      { source: "/practice/saved", destination: "/study/saved" },
    ]
  },
  /**
   * Keep links from the short-lived merged Study area and the original
   * Practice sub-routes working.
   *
   * Not permanent: a 308 is cached by the browser forever, which is
   * unrecoverable if any of these turn out to be wrong.
   *
   * Next preserves the incoming query string, so ?planTask= and ?due= survive.
   */
  async redirects() {
    return [
      { source: "/learn/facts", destination: "/practice/review?source=facts", permanent: false },
      { source: "/practice/missed", destination: "/practice/review?mode=quiz", permanent: false },
      { source: "/practice/flashcards", destination: "/practice/review?source=questions", permanent: false },
      { source: "/practice/bookmarks", destination: "/practice/saved", permanent: false },

      { source: "/study/review", destination: "/practice/review", permanent: false },
      { source: "/study/saved", destination: "/practice/saved", permanent: false },
      { source: "/study/:slug/lab", destination: "/learn/:slug/lab", permanent: false },
      { source: "/study/:slug/drill", destination: "/learn/:slug/drill", permanent: false },
      { source: "/study/:slug/review", destination: "/learn/:slug/review", permanent: false },
      { source: "/study/:slug", destination: "/learn/:slug", permanent: false },
      { source: "/study", destination: "/learn", permanent: false },
    ]
  },
}

export default withSerwist(nextConfig)
