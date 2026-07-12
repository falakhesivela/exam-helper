import type { MentorConversation } from "@/types"

export type ConversationGroupLabel =
  | "Today"
  | "Yesterday"
  | "Previous 7 days"
  | "Older"

export interface ConversationGroup {
  label: ConversationGroupLabel
  conversations: MentorConversation[]
}

export function filterConversations(
  conversations: MentorConversation[],
  query: string,
): MentorConversation[] {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) return conversations
  return conversations.filter((conversation) =>
    `${conversation.title} ${conversation.examCode ?? ""}`
      .toLocaleLowerCase()
      .includes(normalized),
  )
}

export function groupConversations(
  conversations: MentorConversation[],
  now = new Date(),
): ConversationGroup[] {
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - 7)

  const buckets = new Map<ConversationGroupLabel, MentorConversation[]>([
    ["Today", []],
    ["Yesterday", []],
    ["Previous 7 days", []],
    ["Older", []],
  ])

  for (const conversation of conversations) {
    const updated = new Date(conversation.updatedAt)
    const label: ConversationGroupLabel =
      updated >= startOfToday
        ? "Today"
        : updated >= startOfYesterday
          ? "Yesterday"
          : updated >= startOfWeek
            ? "Previous 7 days"
            : "Older"
    buckets.get(label)?.push(conversation)
  }

  return [...buckets.entries()]
    .filter(([, rows]) => rows.length > 0)
    .map(([label, rows]) => ({ label, conversations: rows }))
}

export function relativeConversationTime(iso: string, now = Date.now()): string {
  const diffMs = Math.max(0, now - new Date(iso).getTime())
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}
