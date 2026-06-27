import type { GeneratedDragQuestion, GeneratedMcqQuestion, GeneratedQuestion } from "./schemas"

const OPTION_IDS = ["a", "b", "c", "d", "e", "f", "g", "h"] as const

export function validateMcqQuestion(q: GeneratedMcqQuestion): string | null {
  if (q.options.length < 3) return "Fewer than 3 options"
  if (q.options.length > 6) return "More than 6 options"

  const optionIds = new Set<string>()
  for (const opt of q.options) {
    if (optionIds.has(opt.id)) return "Duplicate option id"
    optionIds.add(opt.id)
    if (!opt.text.trim()) return "Empty option text"
  }

  if (q.correctOptionIds.length === 0) return "No correct option"
  for (const id of q.correctOptionIds) {
    if (!optionIds.has(id)) return "Correct id not in options"
  }

  if (q.multiSelect && q.correctOptionIds.length < 2) {
    return "Multi-select needs 2+ correct answers"
  }
  if (!q.multiSelect && q.correctOptionIds.length !== 1) {
    return "Single-select must have exactly one correct answer"
  }

  if (!q.explanation.trim()) return "Missing explanation"
  if (!q.topic.trim()) return "Missing topic"
  const scenario = q.scenario?.trim()
  const promptMin = scenario ? 10 : 20
  if (!q.prompt.trim() || q.prompt.length < promptMin) return "Prompt too short"
  if (scenario && scenario.length < 20) return "Scenario too short"

  return null
}

export function validateDragQuestion(q: GeneratedDragQuestion): string | null {
  if (!q.explanation.trim()) return "Missing explanation"
  if (!q.topic.trim()) return "Missing topic"
  const scenario = q.scenario?.trim()
  const promptMin = scenario ? 10 : 20
  if (!q.prompt.trim() || q.prompt.length < promptMin) return "Prompt too short"
  if (scenario && scenario.length < 20) return "Scenario too short"

  if (q.questionType === "drag_match") {
    const itemIds = new Set(q.items.map((i) => i.id))
    const targetIds = new Set(q.targets.map((t) => t.id))
    if (q.items.length !== q.targets.length) return "Items and targets count mismatch"
    const matched = new Set(Object.values(q.correctMatch))
    if (Object.keys(q.correctMatch).length !== q.targets.length) {
      return "Incomplete match mapping"
    }
    for (const [targetId, itemId] of Object.entries(q.correctMatch)) {
      if (!targetIds.has(targetId) || !itemIds.has(itemId)) return "Invalid match ids"
      if (matched.size !== q.items.length) return "Duplicate or missing item in matches"
    }
  }

  if (q.questionType === "drag_order") {
    const itemIds = new Set(q.items.map((i) => i.id))
    if (q.correctOrder.length !== q.items.length) return "Order length mismatch"
    for (const id of q.correctOrder) {
      if (!itemIds.has(id)) return "Invalid order id"
    }
  }

  if (q.questionType === "drag_categorize") {
    const itemIds = new Set(q.items.map((i) => i.id))
    const catIds = new Set(q.categories.map((c) => c.id))
    const seen = new Set<string>()
    for (const [catId, ids] of Object.entries(q.correctBuckets)) {
      if (!catIds.has(catId)) return "Invalid category id"
      for (const id of ids) {
        if (!itemIds.has(id)) return "Invalid bucket item id"
        seen.add(id)
      }
    }
    if (seen.size !== q.items.length) return "Items not fully categorized"
  }

  if (q.questionType === "select_grid") {
    const colIds = new Set(q.columns.map((c) => c.id))
    const rowIds = new Set(q.rows.map((r) => r.id))
    if (rowIds.size !== q.rows.length) return "Duplicate row ids"
    if (colIds.size < 2) return "Need at least two columns"
    if (Object.keys(q.correctByRow).length !== q.rows.length) {
      return "Every row needs a correct answer"
    }
    for (const [rowId, colId] of Object.entries(q.correctByRow)) {
      if (!rowIds.has(rowId) || !colIds.has(colId)) return "Invalid grid answer id"
    }
  }

  return null
}

export function validateQuestion(q: GeneratedQuestion): string | null {
  if (q.questionType && q.questionType !== "mcq") {
    return validateDragQuestion(q)
  }
  return validateMcqQuestion(q as GeneratedMcqQuestion)
}

export function assignOptionIds(
  questions: GeneratedMcqQuestion[],
): GeneratedMcqQuestion[] {
  return questions.map((q) => ({
    ...q,
    options: q.options.map((opt, i) => ({
      ...opt,
      id: OPTION_IDS[i] ?? `opt-${i}`,
    })),
    correctOptionIds: q.correctOptionIds.map((id, i) => {
      const idx = q.options.findIndex((o) => o.id === id)
      return OPTION_IDS[idx >= 0 ? idx : i] ?? id
    }),
  }))
}

export function assignDragIds(
  questions: GeneratedDragQuestion[],
): GeneratedDragQuestion[] {
  return questions.map((q) => {
    if (q.questionType === "drag_match") {
      return {
        ...q,
        items: q.items.map((item, i) => ({
          ...item,
          id: OPTION_IDS[i] ?? `item-${i}`,
        })),
        targets: q.targets.map((target, i) => ({
          ...target,
          id: `t${i + 1}`,
        })),
        correctMatch: Object.fromEntries(
          Object.entries(q.correctMatch).map(([targetId, itemId], i) => {
            const targetIdx = q.targets.findIndex((t) => t.id === targetId)
            const itemIdx = q.items.findIndex((it) => it.id === itemId)
            return [
              `t${(targetIdx >= 0 ? targetIdx : i) + 1}`,
              OPTION_IDS[itemIdx >= 0 ? itemIdx : i] ?? itemId,
            ]
          }),
        ),
      }
    }

    if (q.questionType === "drag_order") {
      const items = q.items.map((item, i) => ({
        ...item,
        id: OPTION_IDS[i] ?? `item-${i}`,
      }))
      const idMap = new Map(
        q.items.map((item, i) => [item.id, OPTION_IDS[i] ?? `item-${i}`]),
      )
      return {
        ...q,
        items,
        correctOrder: q.correctOrder.map((id) => idMap.get(id) ?? id),
      }
    }

    const items = q.items.map((item, i) => ({
      ...item,
      id: OPTION_IDS[i] ?? `item-${i}`,
    }))
    const idMap = new Map(
      q.items.map((item, i) => [item.id, OPTION_IDS[i] ?? `item-${i}`]),
    )
    const catMap = new Map(
      q.categories.map((cat, i) => [cat.id, `c${i + 1}`]),
    )
    return {
      ...q,
      categories: q.categories.map((cat, i) => ({
        ...cat,
        id: `c${i + 1}`,
      })),
      items,
      correctBuckets: Object.fromEntries(
        Object.entries(q.correctBuckets).map(([catId, ids]) => [
          catMap.get(catId) ?? catId,
          ids.map((id) => idMap.get(id) ?? id),
        ]),
      ),
    }
  })
}

export function filterValidQuestions(
  questions: GeneratedQuestion[],
): GeneratedQuestion[] {
  return questions
    .map((q) => {
      if (q.questionType && q.questionType !== "mcq") {
        return assignDragIds([q])[0]
      }
      return assignOptionIds([q as GeneratedMcqQuestion])[0]
    })
    .filter((q) => validateQuestion(q) === null)
}

export function filterValidMcqQuestions(
  questions: GeneratedMcqQuestion[],
): GeneratedMcqQuestion[] {
  return assignOptionIds(questions).filter(
    (q) => validateMcqQuestion(q) === null,
  )
}

export function filterValidDragQuestions(
  questions: GeneratedDragQuestion[],
): GeneratedDragQuestion[] {
  return assignDragIds(questions).filter(
    (q) => validateDragQuestion(q) === null,
  )
}
