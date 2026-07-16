/**
 * Bundler stand-in for lib/mock-data.ts. next.config.mjs aliases
 * "@/lib/mock-data" here whenever mocks are off (see turbopack.resolveAlias),
 * so ~950 lines of demo content stay out of real builds.
 *
 * Every call site is behind a USE_MOCKS check that is false in those builds,
 * so nothing in this file can execute. Functions still throw loudly in case a
 * future call site forgets the guard. Type-checking is unaffected: tsc always
 * resolves "@/lib/mock-data" to the real module, so the export list here must
 * stay in sync with it — a missing name fails the production build.
 */

function absent(name: string): never {
  throw new Error(
    `${name}: lib/mock-data is excluded from non-mock builds (lib/mock-data.stub.ts)`,
  )
}

const never = undefined as never

export type { ExamConfig } from "./mock-data"

export const mockProfile = never
export const mockTopicMastery = never
export const mockMasteryTrend = never
export const mockReadinessTrend = never
export const mockPlanCoaching = never
export const mockClarifyingQuestions = never
export const mockHistory = never
export const SAMPLE_QUESTIONS = never
export const DEFAULT_EXAM = never

export const buildMockExamTips = () => absent("buildMockExamTips")
export const buildMockLabCatalog = () => absent("buildMockLabCatalog")
export const buildMockTopicLab = () => absent("buildMockTopicLab")
export const buildMockUserExams = () => absent("buildMockUserExams")
export const buildMockStreak = () => absent("buildMockStreak")
export const buildMockStudyPlan = () => absent("buildMockStudyPlan")
export const buildMockTeam = () => absent("buildMockTeam")
export const buildMockTeamInvites = () => absent("buildMockTeamInvites")
export const buildMockTeamAssignments = () => absent("buildMockTeamAssignments")
export const buildMockTeamAssignmentResults = () => absent("buildMockTeamAssignmentResults")
export const buildMockTeamBilling = () => absent("buildMockTeamBilling")
export const buildMockBookmarks = () => absent("buildMockBookmarks")
export const buildMockMissedQuestions = () => absent("buildMockMissedQuestions")
export const buildMockLearnTopics = () => absent("buildMockLearnTopics")
export const buildMockFactCards = () => absent("buildMockFactCards")
export const buildMockTopicLesson = () => absent("buildMockTopicLesson")
export const generateMockTopicLesson = () => absent("generateMockTopicLesson")
export const createSessionFromIntake = () => absent("createSessionFromIntake")
export const buildExamQuestions = () => absent("buildExamQuestions")
export const createExamSession = () => absent("createExamSession")
