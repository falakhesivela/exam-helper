"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Check,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/lib/api/client"
import {
  filterConversations,
  groupConversations,
  relativeConversationTime,
} from "@/lib/mentor/conversations"
import { useSessionStore } from "@/lib/store/use-session-store"
import { cn } from "@/lib/utils"
import type { MentorConversation } from "@/types"

interface MentorThreadListProps {
  variant?: "page" | "sidebar"
  onConversationSelect?: () => void
}

export function MentorThreadList({
  variant = "page",
  onConversationSelect,
}: MentorThreadListProps) {
  const activeExamCode = useSessionStore((s) => s.activeExamCode)
  const [scope, setScope] = useState<"active" | "all">("active")
  const [query, setQuery] = useState("")
  const [conversations, setConversations] = useState<MentorConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteCandidate, setDeleteCandidate] =
    useState<MentorConversation | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState("")

  const load = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLoading(true)
      try {
        const { conversations: rows } = await api.mentorConversations(
          scope === "active" ? activeExamCode : null,
        )
        setConversations(rows)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Could not load conversations",
        )
      } finally {
        setLoading(false)
      }
    },
    [activeExamCode, scope],
  )

  useEffect(() => {
    void load(true)
  }, [load])

  useEffect(() => {
    const refresh = () => void load()
    window.addEventListener("focus", refresh)
    window.addEventListener("mentor:changed", refresh)
    return () => {
      window.removeEventListener("focus", refresh)
      window.removeEventListener("mentor:changed", refresh)
    }
  }, [load])

  const groups = useMemo(
    () => groupConversations(filterConversations(conversations, query)),
    [conversations, query],
  )

  async function remove() {
    if (!deleteCandidate) return
    const target = deleteCandidate
    setDeleting(target.id)
    setDeleteCandidate(null)
    const previous = conversations
    setConversations((rows) => rows.filter((row) => row.id !== target.id))
    try {
      await api.deleteMentorConversation(target.id)
      window.dispatchEvent(new Event("mentor:changed"))
    } catch (err) {
      setConversations(previous)
      toast.error(err instanceof Error ? err.message : "Could not delete")
    } finally {
      setDeleting(null)
    }
  }

  async function saveTitle(conversation: MentorConversation) {
    const title = draftTitle.trim()
    if (!title || title === conversation.title) {
      setEditing(null)
      return
    }
    try {
      const { conversation: updated } = await api.renameMentorConversation(
        conversation.id,
        title,
      )
      setConversations((rows) =>
        rows.map((row) => (row.id === updated.id ? updated : row)),
      )
      setEditing(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not rename chat")
    }
  }

  const isSidebar = variant === "sidebar"

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col",
        isSidebar ? "h-full min-w-0 flex-1" : "gap-5",
      )}
    >
      <div className={cn("flex flex-col gap-3", isSidebar && "border-b p-4")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1
              className={cn(
                "font-semibold tracking-tight",
                isSidebar ? "text-lg" : "text-2xl",
              )}
            >
              Mentor
            </h1>
            {!isSidebar && (
              <p className="mt-1 text-sm text-muted-foreground text-pretty">
                Your AI coach for {activeExamCode ?? "your exam"}, grounded in
                your progress and exam blueprint.
              </p>
            )}
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link href="/mentor/new" onClick={onConversationSelect}>
              <Plus data-icon="inline-start" />
              New chat
            </Link>
          </Button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations"
            aria-label="Search Mentor conversations"
            className="pl-9"
          />
        </div>

        {activeExamCode && (
          <div className="flex gap-1 rounded-lg bg-muted p-1" aria-label="Exam scope">
            {(["active", "all"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setScope(value)}
                aria-pressed={scope === value}
                className={cn(
                  "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  scope === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {value === "active" ? activeExamCode : "All exams"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className={cn(
          "min-h-0 flex-1",
          isSidebar ? "no-scrollbar overflow-y-auto p-2" : "",
        )}
      >
        {loading ? (
          <div className="space-y-2 p-2" aria-label="Loading conversations">
            {[0, 1, 2].map((item) => (
              <div key={item} className="space-y-2 rounded-xl border p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center gap-3 text-center",
              isSidebar ? "px-4 py-10" : "rounded-2xl border bg-card p-10",
            )}
          >
            <MessageCircle className="size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {query ? "No matching conversations" : "No conversations yet"}
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground text-pretty">
                {query
                  ? "Try another search or switch the exam filter."
                  : "Start with a weak domain, a study plan, or any exam question."}
              </p>
            </div>
            {!query && (
              <Button asChild size="sm" variant={isSidebar ? "outline" : "default"}>
                <Link href="/mentor/new" onClick={onConversationSelect}>
                  Start your first chat
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <section key={group.label} aria-labelledby={`mentor-${group.label}`}>
                <h2
                  id={`mentor-${group.label}`}
                  className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                >
                  {group.label}
                </h2>
                <div className="space-y-1">
                  {group.conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={cn(
                        "group flex items-center gap-1 rounded-xl border border-transparent p-2 transition-colors hover:border-border hover:bg-accent/60",
                        !isSidebar && "bg-card px-3 py-3",
                      )}
                    >
                      {editing === conversation.id ? (
                        <div className="flex min-w-0 flex-1 items-center gap-1">
                          <Input
                            autoFocus
                            value={draftTitle}
                            maxLength={80}
                            onChange={(event) => setDraftTitle(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter")
                                void saveTitle(conversation)
                              if (event.key === "Escape") setEditing(null)
                            }}
                            aria-label="Conversation title"
                            className="h-8"
                          />
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => void saveTitle(conversation)}
                            aria-label="Save title"
                          >
                            <Check />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setEditing(null)}
                            aria-label="Cancel rename"
                          >
                            <X />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Link
                            href={`/mentor/${conversation.id}`}
                            onClick={onConversationSelect}
                            className="flex min-w-0 flex-1 flex-col gap-1 rounded-md px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <span className="truncate text-sm font-medium">
                              {conversation.title}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              {conversation.examCode && (
                                <span>{conversation.examCode}</span>
                              )}
                              <span>·</span>
                              <span>{conversation.messageCount} messages</span>
                              <span>·</span>
                              <span>
                                {relativeConversationTime(conversation.updatedAt)}
                              </span>
                            </span>
                          </Link>
                          <div className="flex shrink-0 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setEditing(conversation.id)
                                setDraftTitle(conversation.title)
                              }}
                              aria-label={`Rename ${conversation.title}`}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={deleting === conversation.id}
                              onClick={() => setDeleteCandidate(conversation)}
                              aria-label={`Delete ${conversation.title}`}
                            >
                              {deleting === conversation.id ? (
                                <Spinner className="size-3.5" />
                              ) : (
                                <Trash2 className="size-3.5 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={Boolean(deleteCandidate)}
        onOpenChange={(open) => {
          if (!open) setDeleteCandidate(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteCandidate?.title}” and all of its messages will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void remove()}>
              Delete conversation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
