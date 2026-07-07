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
  images: {
    unoptimized: true,
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
}

export default withSerwist(nextConfig)
