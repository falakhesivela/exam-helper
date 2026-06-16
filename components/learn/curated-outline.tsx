"use client"

import { ListChecks } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CuratedOutlineProps {
  outline: string[]
}

/** Static checklist of what the exam expects for this topic. */
export function CuratedOutline({ outline }: CuratedOutlineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="size-4 text-primary" />
          What you need to know
        </CardTitle>
        <CardDescription>Curated outline for this exam topic</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2.5">
          {outline.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/90"
            >
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
