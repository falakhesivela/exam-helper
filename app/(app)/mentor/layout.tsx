import type { ReactNode } from "react"
import { MentorWorkspace } from "@/components/mentor/mentor-workspace"

export default function MentorLayout({ children }: { children: ReactNode }) {
  return <MentorWorkspace>{children}</MentorWorkspace>
}
