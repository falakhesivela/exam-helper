import { notFound } from "next/navigation"
import { getAllExamHubs, getExamHubBySlug } from "@/lib/content/exams"
import { getExamBlueprint } from "@/lib/exams/registry"
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "../../og-template"

export const alt = "Prepa exam guide"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export function generateStaticParams() {
  return getAllExamHubs().map((doc) => ({ slug: doc.slug }))
}

export default async function ExamOgImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const doc = getExamHubBySlug(slug)
  if (!doc) notFound()

  const blueprint = getExamBlueprint(doc.examCode)

  return renderOgImage({
    kicker: `${doc.examCode} · Study guide`,
    title: doc.title,
    footer: blueprint
      ? `${blueprint.questionCount} questions · ${blueprint.durationMin} min · ${blueprint.passMark}% to pass`
      : "Free AI practice questions",
  })
}
