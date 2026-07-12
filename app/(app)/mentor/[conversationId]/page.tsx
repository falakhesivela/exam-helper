import { MentorChat } from "@/components/mentor/mentor-chat"
import { MentorChatShell } from "@/components/mentor/mentor-chat-shell"

export default async function MentorConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params

  return (
    <MentorChatShell>
      <MentorChat conversationId={conversationId} />
    </MentorChatShell>
  )
}
