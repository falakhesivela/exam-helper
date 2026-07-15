import type { UserProfile } from "@/types"
import { limitsFor } from "@/lib/config/tiers"

/** Blank profile used before API hydration (never show mock demo data). */
export const emptyProfile: UserProfile = {
  name: "",
  email: "",
  isAnonymous: true,
  plan: "free",
  subscriptionStatus: null,
  planExpiresAt: null,
  limits: limitsFor("free"),
  dailyLimit: limitsFor("free").questions,
  questionsUsedToday: 0,
  streakDays: 0,
  longestStreak: 0,
  dailyGoal: 10,
  onboardedAt: null,
  activeExam: null,
}
