import { MentorChat } from "@/components/mentor/mentor-chat"
import { MentorChatShell } from "@/components/mentor/mentor-chat-shell"

/**
 * A brand-new thread. The server mints the conversation id on the first send and
 * reports it back via the stream's `ready` event, which swaps the URL to
 * /mentor/{id} without remounting the chat.
 *
 * `?seed=` pre-fills the composer for deep-links (e.g. "ask Mentor why I missed
 * these" from an exam debrief).
 */
export default async function NewMentorChatPage({
  searchParams,
}: {
  searchParams: Promise<{ seed?: string }>
}) {
  const { seed } = await searchParams

  return (
    <MentorChatShell>
      <MentorChat seed={seed} />
    </MentorChatShell>
  )
}
