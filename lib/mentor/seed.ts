export const MENTOR_SEED_STORAGE_KEY = "prepa:mentor-seed"

/** Store a long contextual seed outside the URL before navigating to Mentor. */
export function storeMentorSeed(seed: string): void {
  try {
    sessionStorage.setItem(MENTOR_SEED_STORAGE_KEY, seed)
  } catch {
    // The URL fallback still works when storage is unavailable.
  }
}

/** Read once so an old debrief prompt cannot leak into a later blank chat. */
export function consumeMentorSeed(): string | null {
  try {
    const seed = sessionStorage.getItem(MENTOR_SEED_STORAGE_KEY)
    sessionStorage.removeItem(MENTOR_SEED_STORAGE_KEY)
    return seed
  } catch {
    return null
  }
}

export function mentorSeedHref(seed: string): string {
  const fallback = seed.length > 240 ? `${seed.slice(0, 237)}…` : seed
  return `/mentor/new?seed=${encodeURIComponent(fallback)}`
}
