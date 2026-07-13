import { MentorChat } from "@/components/mentor/mentor-chat"
import { MentorChatShell } from "@/components/mentor/mentor-chat-shell"

export default function MentorPage() {
  return (
    <MentorChatShell>
      <MentorChat />
    </MentorChatShell>
  )
}
