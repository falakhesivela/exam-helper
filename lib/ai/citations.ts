import type { ExamProvider } from "@/lib/exams/types"

export interface Reference {
  label: string
  url: string
}

/**
 * Official documentation domains per exam provider. Citations are constrained to
 * these so the AI can't pass off invented or third-party URLs as authoritative.
 * Providers with vendor-neutral exams (comptia) or unknown provider (custom) get
 * a broad authoritative allowlist rather than a strict single-vendor one.
 */
const PROVIDER_DOMAINS: Record<ExamProvider, string[]> = {
  aws: ["docs.aws.amazon.com", "aws.amazon.com"],
  azure: ["learn.microsoft.com", "docs.microsoft.com", "azure.microsoft.com"],
  gcp: ["cloud.google.com", "developers.google.com", "firebase.google.com"],
  cisco: ["cisco.com", "learningnetwork.cisco.com"],
  isc2: ["isc2.org"],
  comptia: [
    "comptia.org",
    "learn.microsoft.com",
    "docs.aws.amazon.com",
    "cisco.com",
    "redhat.com",
    "ietf.org",
  ],
  custom: [],
}

/** Hostname (lowercased) of a URL, or null if it doesn't parse. */
function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }
}

/** True when the URL's host is (a subdomain of) one of the provider's domains. */
export function isOfficialUrl(url: string, provider: ExamProvider): boolean {
  const host = hostOf(url)
  if (!host) return false
  const domains = PROVIDER_DOMAINS[provider]
  // Empty allowlist (custom) → don't domain-filter; verification still applies.
  if (domains.length === 0) return true
  return domains.some((d) => host === d || host.endsWith(`.${d}`))
}

/** A prompt line steering the model to cite only official documentation. */
export function officialDomainGuidance(provider?: ExamProvider): string {
  const domains = provider ? PROVIDER_DOMAINS[provider] : []
  if (domains.length > 0) {
    return `- references MUST link only to official documentation on: ${domains.join(", ")}. Use real, specific doc pages. Never invent URLs — omit a reference rather than guess.`
  }
  return "- references MUST link only to official vendor/standards documentation (the product's own docs site). Use real, specific pages. Never invent URLs — omit a reference rather than guess."
}
