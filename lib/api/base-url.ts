/** Backend base URL when calling FastAPI directly (cross-origin). Empty = same-origin via Next.js rewrite. */
export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "")
  return base ?? ""
}

/** True when the browser calls FastAPI on a different origin (needs CORS). */
export function isExternalApi(): boolean {
  return getApiBaseUrl().length > 0
}

/** Resolve an app-relative API path against the backend. */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl()
  if (!base) return path
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}
