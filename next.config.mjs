import { withSerwist } from "@serwist/turbopack"

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["pdf-parse", "esbuild"],
}

export default withSerwist(nextConfig)
