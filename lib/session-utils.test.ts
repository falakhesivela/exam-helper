import { describe, expect, it } from "vitest"
import type { Question } from "@/types"
import {
  expectedSelectionCount,
  multiSelectSubmitLabel,
  validMcqSelections,
} from "./session-utils"

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
    ...overrides,
  }
}

describe("expectedSelectionCount", () => {
  it("detects explicit select-two phrasing", () => {
    expect(expectedSelectionCount(mcq())).toBe(2)
    expect(
      expectedSelectionCount(
        mcq({ prompt: "Choose three responses that apply." }),
      ),
    ).toBe(3)
    expect(
      expectedSelectionCount(
        mcq({ prompt: "Pick 2 answers from the list below." }),
      ),
    ).toBe(2)
  })

  it("ignores incidental 'two' in scenario text", () => {
    expect(
      expectedSelectionCount(
        mcq({
          prompt:
            "A workload runs across two Regions. Which single DR approach best satisfies RTO?",
          multiSelect: false,
        }),
      ),
    ).toBeNull()
    expect(
      expectedSelectionCount(
        mcq({
          prompt:
            "Design DR across two Regions. (Select all that apply.)",
        }),
      ),
    ).toBeNull()
  })

  it("returns null for single-select and unknown multi-select stems", () => {
    expect(expectedSelectionCount(mcq({ multiSelect: false }))).toBeNull()
    expect(
      expectedSelectionCount(
        mcq({ prompt: "Select all strategies that apply." }),
      ),
    ).toBeNull()
  })
})

describe("validMcqSelections", () => {
  it("drops ids that are not on the question", () => {
    const q = mcq()
    expect(validMcqSelections(q, ["a", "stale", "c"])).toEqual(["a", "c"])
  })
})

describe("multiSelectSubmitLabel", () => {
  it("shows progress when under-selected", () => {
    expect(multiSelectSubmitLabel(1, 2)).toBe("Select 1 more (1/2)")
  })

  it("shows over-selection clearly", () => {
    expect(multiSelectSubmitLabel(3, 2)).toBe("Too many selected (3/2)")
  })
})
