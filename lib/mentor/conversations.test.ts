import assert from "node:assert/strict"
import { test } from "node:test"
import type { MentorConversation } from "@/types"
import {
  filterConversations,
  groupConversations,
  relativeConversationTime,
} from "./conversations.ts"

function conversation(
  id: string,
  title: string,
  updatedAt: string,
  examCode = "SAA-C03",
): MentorConversation {
  return {
    id,
    title,
    examCode,
    messageCount: 2,
    createdAt: updatedAt,
    updatedAt,
  }
}

test("filters thread titles and exam codes case-insensitively", () => {
  const rows = [
    conversation("1", "VPC routing", "2026-07-12T10:00:00Z"),
    conversation("2", "Identity policies", "2026-07-11T10:00:00Z", "SCS-C02"),
  ]

  assert.deepEqual(filterConversations(rows, "vpc").map((row) => row.id), ["1"])
  assert.deepEqual(filterConversations(rows, "scs").map((row) => row.id), ["2"])
  assert.equal(filterConversations(rows, "").length, 2)
})

test("groups conversations by recency without changing their order", () => {
  const now = new Date("2026-07-12T18:00:00Z")
  const rows = [
    conversation("today", "Today", "2026-07-12T10:00:00Z"),
    conversation("yesterday", "Yesterday", "2026-07-11T10:00:00Z"),
    conversation("week", "This week", "2026-07-08T10:00:00Z"),
    conversation("old", "Old", "2026-06-01T10:00:00Z"),
  ]

  const groups = groupConversations(rows, now)
  assert.deepEqual(
    groups.map((group) => group.label),
    ["Today", "Yesterday", "Previous 7 days", "Older"],
  )
  assert.deepEqual(
    groups.flatMap((group) => group.conversations.map((row) => row.id)),
    rows.map((row) => row.id),
  )
})

test("formats compact relative times", () => {
  const now = new Date("2026-07-12T18:00:00Z").getTime()
  assert.equal(relativeConversationTime("2026-07-12T17:59:30Z", now), "just now")
  assert.equal(relativeConversationTime("2026-07-12T17:30:00Z", now), "30m")
  assert.equal(relativeConversationTime("2026-07-10T18:00:00Z", now), "2d")
})
