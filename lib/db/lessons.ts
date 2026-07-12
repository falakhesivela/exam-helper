import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  LearnTopic,
  LessonStatus,
  TopicLesson,
  TopicLessonContent,
} from "@/types"
import { getCatalogTopicBySlug, getExamCatalog } from "@/lib/learning/catalog"
import { inferExamFromSessions, resolveTopicName } from "@/lib/learning/topic-resolver"
import {
  checkLessonLimit,
  getTodayLessonUsage,
  incrementLessonUsage,
  LessonLimitExceededError,
} from "@/lib/db/usage"
import { generateTopicLesson, type StreamingLessonContent } from "@/lib/ai"

function hasAiContent(content?: TopicLessonContent): boolean {
  return Boolean(content && content.deepDive.length > 0)
}

interface LessonProgressRow {
  user_id: string
  topic_lesson_id: string
  status: "started" | "completed"
  bookmarked: boolean
  completed_at: string | null
}

export async function getUserExamContext(
  admin: SupabaseClient,
  userId: string,
): Promise<{ examCode: string; exam: string }> {
  const { data: sessions } = await admin
    .from("sessions")
    .select("exam_code, exam, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10)

  return inferExamFromSessions(
    (sessions ?? []).map((s) => ({
      examCode: s.exam_code,
      exam: s.exam,
      createdAt: s.created_at,
    })),
  )
}

export async function loadLearnTopics(
  admin: SupabaseClient,
  userId: string,
): Promise<LearnTopic[]> {
  const [{ data: mastery }, { examCode }] = await Promise.all([
    admin
      .from("topic_mastery")
      .select("topic, mastery, questions_answered")
      .eq("user_id", userId)
      .order("mastery", { ascending: true }),
    getUserExamContext(admin, userId),
  ])

  // Project only the deepDive array instead of the full AI lesson JSON —
  // this listing only needs to know whether AI content exists.
  const { data: lessons } = await admin
    .from("topic_lessons")
    .select("id, topic_slug, topic_name, exam_code, deep_dive:content->deepDive")
    .eq("user_id", userId)
    .eq("exam_code", examCode)

  const lessonIds = (lessons ?? []).map((l) => l.id)
  const progressMap = new Map<string, LessonProgressRow>()

  if (lessonIds.length > 0) {
    const { data: progress } = await admin
      .from("lesson_progress")
      .select("*")
      .eq("user_id", userId)
      .in("topic_lesson_id", lessonIds)

    for (const row of progress ?? []) {
      progressMap.set(row.topic_lesson_id, row as LessonProgressRow)
    }
  }

  const lessonBySlug = new Map(
    (lessons ?? []).map((l) => [
      l.topic_slug as string,
      l as { id: string; topic_slug: string; deep_dive: unknown },
    ]),
  )

  const topics = (mastery ?? []) as {
    topic: string
    mastery: number
    questions_answered: number
  }[]

  if (topics.length === 0) return []

  return topics.map((t) => {
    const resolved = resolveTopicName(t.topic, examCode)
    const lesson = lessonBySlug.get(resolved.slug)
    const progress = lesson ? progressMap.get(lesson.id) : undefined

    let lessonStatus: LessonStatus = "not-started"
    if (progress?.status === "completed") lessonStatus = "completed"
    else if (lesson || progress?.status === "started") lessonStatus = "started"

    return {
      topic: t.topic,
      slug: resolved.slug,
      mastery: Number(t.mastery),
      questionsAnswered: t.questions_answered,
      lessonId: lesson?.id,
      lessonStatus,
      bookmarked: progress?.bookmarked ?? false,
      hasAiContent: Array.isArray(lesson?.deep_dive) && lesson.deep_dive.length > 0,
    }
  })
}

export async function loadTopicLesson(
  admin: SupabaseClient,
  userId: string,
  topicSlug: string,
  timezone: string,
): Promise<TopicLesson> {
  const examContext = await getUserExamContext(admin, userId)
  const { examCode, exam } = examContext

  const { data: masteryRows } = await admin
    .from("topic_mastery")
    .select("topic, mastery, questions_answered")
    .eq("user_id", userId)

  const masteryList = (masteryRows ?? []) as {
    topic: string
    mastery: number
    questions_answered: number
  }[]

  const matchedMastery = masteryList.find((m) => {
    const resolved = resolveTopicName(m.topic, examCode)
    return resolved.slug === topicSlug
  })

  const catalogTopic =
    getCatalogTopicBySlug(examCode, topicSlug) ??
    getCatalogTopicBySlug("CUSTOM", topicSlug)

  const topicName =
    matchedMastery?.topic ??
    catalogTopic?.name ??
    topicSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  const { data: existingLesson } = await admin
    .from("topic_lessons")
    .select("*")
    .eq("user_id", userId)
    .eq("exam_code", examCode)
    .eq("topic_slug", topicSlug)
    .maybeSingle()

  let progress: LessonProgressRow | null = null
  if (existingLesson) {
    const { data } = await admin
      .from("lesson_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("topic_lesson_id", existingLesson.id)
      .maybeSingle()
    progress = data as LessonProgressRow | null
  }

  const limitCheck = await checkLessonLimit(admin, userId)
  const lessonsUsedToday = limitCheck.used
  const dailyLessonLimit = limitCheck.dailyLimit

  const outline = catalogTopic?.outline ?? [
    "Core concepts for this topic",
    "Key terminology and definitions",
    "Common exam scenarios and decision criteria",
    "Best practices and pitfalls to avoid",
  ]

  let status: LessonStatus = "not-started"
  if (progress?.status === "completed") status = "completed"
  else if (existingLesson || progress?.status === "started") status = "started"

  return {
    id: existingLesson?.id,
    topicSlug,
    topicName,
    exam,
    examCode,
    mastery: Number(matchedMastery?.mastery ?? 50),
    questionsAnswered: matchedMastery?.questions_answered ?? 0,
    domainName: catalogTopic?.domainName ?? "General",
    domainWeight: catalogTopic?.domainWeight ?? "—",
    outline,
    curatedReferences: catalogTopic?.references ?? [],
    content: hasAiContent(existingLesson?.content as TopicLessonContent | undefined)
      ? (existingLesson?.content as TopicLessonContent)
      : undefined,
    status,
    bookmarked: progress?.bookmarked ?? false,
    lessonsUsedToday,
    dailyLessonLimit,
  }
}

export async function generateAndCacheLesson(
  admin: SupabaseClient,
  userId: string,
  topicSlug: string,
  timezone: string,
  force = false,
  onDelta?: (partial: StreamingLessonContent) => void,
): Promise<TopicLesson> {
  const lesson = await loadTopicLesson(admin, userId, topicSlug, timezone)

  if (hasAiContent(lesson.content) && !force) {
    return lesson
  }

  await enforceLessonLimitForGeneration(admin, userId)

  const catalog = getExamCatalog(lesson.examCode)

  const { data: upload } = await admin
    .from("uploads")
    .select("extracted_text")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const content = await generateTopicLesson(
    {
      exam: lesson.exam,
      examCode: lesson.examCode,
      topic: lesson.topicName,
      topicOutline: lesson.outline,
      masteryPercent: lesson.mastery,
      questionsAnswered: lesson.questionsAnswered,
      groundingText: upload?.extracted_text,
    },
    { userId },
    onDelta,
  )

  const { data: profile } = await admin
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .single()

  const tz = profile?.timezone ?? timezone

  const { data: saved, error } = await admin
    .from("topic_lessons")
    .upsert(
      {
        user_id: userId,
        exam_code: catalog.examCode,
        topic_slug: topicSlug,
        topic_name: lesson.topicName,
        content,
      },
      { onConflict: "user_id,exam_code,topic_slug" },
    )
    .select("*")
    .single()

  if (error || !saved) {
    throw new Error(error?.message ?? "Failed to save lesson")
  }

  await admin.from("lesson_progress").upsert(
    {
      user_id: userId,
      topic_lesson_id: saved.id,
      status: "started",
    },
    { onConflict: "user_id,topic_lesson_id" },
  )

  if (!hasAiContent(lesson.content) || force) {
    await incrementLessonUsage(admin, userId, tz)
  }

  const lessonsUsedToday = await getTodayLessonUsage(admin, userId, tz)
  const limitCheck = await checkLessonLimit(admin, userId)

  return {
    ...lesson,
    id: saved.id,
    content,
    status: "started",
    lessonsUsedToday,
    dailyLessonLimit: limitCheck.dailyLimit,
  }
}

export async function ensureLessonRecord(
  admin: SupabaseClient,
  userId: string,
  topicSlug: string,
  timezone: string,
): Promise<TopicLesson> {
  const lesson = await loadTopicLesson(admin, userId, topicSlug, timezone)
  if (lesson.id) return lesson

  const emptyContent: TopicLessonContent = {
    deepDive: [],
    commonTraps: [],
    recap: "",
    references: [],
  }

  const { data: saved, error } = await admin
    .from("topic_lessons")
    .upsert(
      {
        user_id: userId,
        exam_code: lesson.examCode,
        topic_slug: topicSlug,
        topic_name: lesson.topicName,
        content: emptyContent,
      },
      { onConflict: "user_id,exam_code,topic_slug" },
    )
    .select("*")
    .single()

  if (error || !saved) {
    throw new Error(error?.message ?? "Failed to create lesson record")
  }

  await admin.from("lesson_progress").upsert(
    {
      user_id: userId,
      topic_lesson_id: saved.id,
      status: "started",
    },
    { onConflict: "user_id,topic_lesson_id" },
  )

  return { ...lesson, id: saved.id, status: "started" }
}

async function enforceLessonLimitForGeneration(
  admin: SupabaseClient,
  userId: string,
) {
  const check = await checkLessonLimit(admin, userId)
  if (!check.allowed) {
    throw new LessonLimitExceededError(check.remaining ?? 0)
  }
}

export async function updateLessonProgress(
  admin: SupabaseClient,
  userId: string,
  lessonId: string,
  updates: { status?: "started" | "completed"; bookmarked?: boolean },
): Promise<{ status: LessonStatus; bookmarked: boolean }> {
  const { data: lesson } = await admin
    .from("topic_lessons")
    .select("id")
    .eq("id", lessonId)
    .eq("user_id", userId)
    .single()

  if (!lesson) throw new Error("Lesson not found")

  const { data, error } = await admin
    .from("lesson_progress")
    .upsert(
      {
        user_id: userId,
        topic_lesson_id: lessonId,
        status: updates.status ?? "started",
        bookmarked: updates.bookmarked ?? false,
        completed_at:
          updates.status === "completed" ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,topic_lesson_id" },
    )
    .select("*")
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update progress")
  }

  return {
    status: data.status === "completed" ? "completed" : "started",
    bookmarked: data.bookmarked,
  }
}
