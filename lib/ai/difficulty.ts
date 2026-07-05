/**
 * Adaptive difficulty: turn a mastery score into a prompt hint that biases the
 * generated question mix. Weak areas lean easier to build confidence; strong
 * areas lean harder to keep the learner challenged. Pure and testable.
 */

export type DifficultyBand = "easier" | "balanced" | "harder"

export function difficultyBand(masteryPercent: number): DifficultyBand {
  if (masteryPercent < 40) return "easier"
  if (masteryPercent < 70) return "balanced"
  return "harder"
}

const GUIDANCE: Record<DifficultyBand, string> = {
  easier:
    "Difficulty: lean EASIER — about 50% easy, 40% medium, 10% hard. The learner is still building fundamentals, so favor clear, single-concept questions.",
  balanced:
    "Difficulty: BALANCED — about 25% easy, 50% medium, 25% hard.",
  harder:
    "Difficulty: lean HARDER — about 10% easy, 40% medium, 50% hard. The learner is strong, so use nuanced scenarios and plausible distractors.",
}

/** A prompt line steering the difficulty distribution from a mastery score. */
export function difficultyGuidance(masteryPercent: number): string {
  return GUIDANCE[difficultyBand(masteryPercent)]
}

/** A prompt line for a difficulty the learner explicitly chose at intake. */
export function difficultyPreferenceGuidance(band: DifficultyBand): string {
  return GUIDANCE[band]
}
