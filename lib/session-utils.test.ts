import { describe, it } from "node:test"
import assert from "node:assert/strict"
import type { Question } from "@/types"
import {
  expectedSelectionCount,
  multiSelectSubmitLabel,
  validMcqSelections,
} from "./session-utils.ts"

function mcq(overrides: Partial<Question> = {}): Question {
  return {
    id: "q1",
    topic: "Resilience",
    difficulty: "medium",
    multiSelect: true,
    prompt: "Which TWO strategies satisfy the requirements?",
    options: [
      { id: "a", text: "Pilot light" },
      { id: "b", text: "Backup and restore" },
      { id: "c", text: "Warm standby" },
      { id: "d", text: "Multi-site active/active across two Regions" },
    ],
    correctOptionIds: ["a", "c"],
    explanation: "…",
    references: [],
    ...overrides,
  } as Question
}

describe("expectedSelectionCount", () => {
  it("detects explicit select-two phrasing", () => {
    assert.equal(expectedSelectionCount(mcq()), 2)
    assert.equal(
      expectedSelectionCount(mcq({ prompt: "Choose three responses that apply." })),
      3,
    )
    assert.equal(
      expectedSelectionCount(mcq({ prompt: "Pick 2 answers from the list below." })),
      2,
    )
  })

  it("ignores incidental 'two' in scenario text", () => {
    assert.equal(
      expectedSelectionCount(
        mcq({
          prompt:
            "A workload runs across two Regions. Which single DR approach best satisfies RTO?",
          multiSelect: false,
        }),
      ),
      null,
    )
    assert.equal(
      expectedSelectionCount(
        mcq({ prompt: "Design DR across two Regions. (Select all that apply.)" }),
      ),
      null,
    )
  })

  it("returns null for single-select and unknown multi-select stems", () => {
    assert.equal(expectedSelectionCount(mcq({ multiSelect: false })), null)
    assert.equal(
      expectedSelectionCount(mcq({ prompt: "Select all strategies that apply." })),
      null,
    )
  })
})

describe("validMcqSelections", () => {
  it("drops ids that are not on the question", () => {
    assert.deepEqual(validMcqSelections(mcq(), ["a", "stale", "c"]), ["a", "c"])
  })
})

describe("multiSelectSubmitLabel", () => {
  it("shows progress when under-selected", () => {
    assert.equal(multiSelectSubmitLabel(1, 2), "Select 1 more (1/2)")
  })

  it("shows over-selection clearly", () => {
    assert.equal(multiSelectSubmitLabel(3, 2), "Too many selected (3/2)")
  })
})
