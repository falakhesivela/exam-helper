import saaC03Catalog from "@/lib/learning/catalog/saa-c03.json"
import type { ExamCatalog } from "@/lib/learning/types"
import { aPlus2201101Blueprint } from "./blueprints/220-1101"
import { ccna200301Blueprint } from "./blueprints/200-301"
import { az104Blueprint } from "./blueprints/az-104"
import { az900Blueprint } from "./blueprints/az-900"
import { clfC02Blueprint } from "./blueprints/clf-c02"
import { cisspBlueprint } from "./blueprints/cissp"
import { dopC02Blueprint } from "./blueprints/dop-c02"
import { dvaC02Blueprint } from "./blueprints/dva-c02"
import { gcpAceBlueprint } from "./blueprints/gcp-ace"
import { n10009Blueprint } from "./blueprints/n10-009"
import { sy0701Blueprint } from "./blueprints/sy0-701"
import { blueprintFromCatalog } from "./from-catalog"
import type { ExamBlueprint } from "./types"

const saaC03Blueprint = blueprintFromCatalog(saaC03Catalog as ExamCatalog, {
  provider: "aws",
  questionCount: 65,
  durationMin: 130,
  passMark: 72,
  questionMix: { singleChoice: 0.7, multipleResponse: 0.3 },
  styleGuide: { scenarioHeavy: true, servicesShortNames: true },
})

/** Exam presets grouped by provider for the picker UI. */
const blueprints: Record<string, ExamBlueprint> = {
  "SAA-C03": saaC03Blueprint,
  "CLF-C02": clfC02Blueprint,
  "DVA-C02": dvaC02Blueprint,
  "DOP-C02": dopC02Blueprint,
  "AZ-900": az900Blueprint,
  "AZ-104": az104Blueprint,
  "GCP-ACE": gcpAceBlueprint,
  "SY0-701": sy0701Blueprint,
  "220-1101": aPlus2201101Blueprint,
  "N10-009": n10009Blueprint,
  "200-301": ccna200301Blueprint,
  CISSP: cisspBlueprint,
}

/** Preset codes in display order (grouped by provider). */
export const EXAM_PRESET_CODES = [
  "SAA-C03",
  "CLF-C02",
  "DVA-C02",
  "DOP-C02",
  "AZ-900",
  "AZ-104",
  "GCP-ACE",
  "SY0-701",
  "220-1101",
  "N10-009",
  "200-301",
  "CISSP",
] as const satisfies readonly (keyof typeof blueprints)[]

export function getExamBlueprint(examCode: string): ExamBlueprint | null {
  return blueprints[examCode.toUpperCase()] ?? null
}

export function listExamPresets(): ExamBlueprint[] {
  return EXAM_PRESET_CODES.map((code) => blueprints[code])
}

export function listExamPresetsByProvider(): Array<{
  provider: ExamBlueprint["provider"]
  presets: ExamBlueprint[]
}> {
  const groups = new Map<ExamBlueprint["provider"], ExamBlueprint[]>()
  for (const preset of listExamPresets()) {
    const list = groups.get(preset.provider) ?? []
    list.push(preset)
    groups.set(preset.provider, list)
  }
  const order: ExamBlueprint["provider"][] = [
    "aws",
    "azure",
    "gcp",
    "comptia",
    "cisco",
    "isc2",
  ]
  return order
    .filter((provider) => groups.has(provider))
    .map((provider) => ({
      provider,
      presets: groups.get(provider)!,
    }))
}

export function getDefaultBlueprint(): ExamBlueprint {
  return blueprints["SAA-C03"]
}
