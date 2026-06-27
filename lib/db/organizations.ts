import type { SupabaseClient } from "@supabase/supabase-js"
import { randomBytes } from "node:crypto"

export type OrgRole = "owner" | "admin" | "member"

export interface TeamMember {
  userId: string
  name: string
  email: string
  role: OrgRole
  overallMastery: number
  questionsAnswered: number
  streakDays: number
  lastActiveDate: string | null
}

export interface Team {
  id: string
  name: string
  /** The requesting user's role in this org. */
  role: OrgRole
  members: TeamMember[]
}

export class OrgError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status = 400,
  ) {
    super(message)
  }
}

/** The org the user belongs to, with their role, or null. */
async function getMembership(admin: SupabaseClient, userId: string) {
  const { data } = await admin
    .from("organization_members")
    .select("org_id, role")
    .eq("user_id", userId)
    .maybeSingle()
  return data as { org_id: string; role: OrgRole } | null
}

/** Load the user's team with each member's progress snapshot, or null. */
export async function loadTeam(
  admin: SupabaseClient,
  userId: string,
): Promise<Team | null> {
  const membership = await getMembership(admin, userId)
  if (!membership) return null

  const { data: org } = await admin
    .from("organizations")
    .select("id, name")
    .eq("id", membership.org_id)
    .single()
  if (!org) return null

  const { data: memberRows } = await admin
    .from("organization_members")
    .select("user_id, role, joined_at")
    .eq("org_id", membership.org_id)
    .order("joined_at", { ascending: true })

  const memberIds = (memberRows ?? []).map((m) => m.user_id)
  if (memberIds.length === 0) return { id: org.id, name: org.name, role: membership.role, members: [] }

  const [{ data: profiles }, { data: mastery }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, name, email, streak_days, last_active_date")
      .in("id", memberIds),
    admin
      .from("topic_mastery")
      .select("user_id, mastery, questions_answered")
      .in("user_id", memberIds),
  ])

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
  const masteryAgg = new Map<string, { sum: number; n: number; q: number }>()
  for (const row of mastery ?? []) {
    const cur = masteryAgg.get(row.user_id) ?? { sum: 0, n: 0, q: 0 }
    cur.sum += Number(row.mastery)
    cur.n += 1
    cur.q += row.questions_answered ?? 0
    masteryAgg.set(row.user_id, cur)
  }

  const members: TeamMember[] = (memberRows ?? []).map((m) => {
    const p = profileMap.get(m.user_id)
    const agg = masteryAgg.get(m.user_id)
    return {
      userId: m.user_id,
      name: p?.name || "",
      email: p?.email || "",
      role: m.role as OrgRole,
      overallMastery: agg && agg.n > 0 ? Math.round(agg.sum / agg.n) : 0,
      questionsAnswered: agg?.q ?? 0,
      streakDays: p?.streak_days ?? 0,
      lastActiveDate: p?.last_active_date ?? null,
    }
  })

  return { id: org.id, name: org.name, role: membership.role, members }
}

/** Create an org (the user becomes owner). Fails if already in a team. */
export async function createOrg(
  admin: SupabaseClient,
  userId: string,
  name: string,
): Promise<Team> {
  if (await getMembership(admin, userId)) {
    throw new OrgError("You're already in a team.", "ALREADY_IN_ORG")
  }
  const { data: org, error } = await admin
    .from("organizations")
    .insert({ name: name.trim().slice(0, 80) || "My Team", owner_id: userId })
    .select("id, name")
    .single()
  if (error || !org) throw error ?? new Error("Failed to create org")

  await admin
    .from("organization_members")
    .insert({ org_id: org.id, user_id: userId, role: "owner" })

  return (await loadTeam(admin, userId))!
}

/** Owner/admin creates a shareable invite token. */
export async function createInvite(
  admin: SupabaseClient,
  userId: string,
): Promise<string> {
  const membership = await getMembership(admin, userId)
  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    throw new OrgError("Only owners can invite.", "FORBIDDEN", 403)
  }
  const token = randomBytes(18).toString("base64url")
  const expires = new Date()
  expires.setDate(expires.getDate() + 14)
  await admin.from("organization_invites").insert({
    token,
    org_id: membership.org_id,
    created_by: userId,
    expires_at: expires.toISOString(),
  })
  return token
}

/** Join an org from an invite token. Fails if already in a team or token bad. */
export async function joinOrg(
  admin: SupabaseClient,
  userId: string,
  token: string,
): Promise<Team> {
  if (await getMembership(admin, userId)) {
    throw new OrgError("You're already in a team.", "ALREADY_IN_ORG")
  }
  const { data: invite } = await admin
    .from("organization_invites")
    .select("org_id, expires_at")
    .eq("token", token)
    .maybeSingle()
  if (!invite) throw new OrgError("Invite not found.", "INVALID_INVITE", 404)
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    throw new OrgError("This invite has expired.", "EXPIRED_INVITE")
  }
  await admin
    .from("organization_members")
    .insert({ org_id: invite.org_id, user_id: userId, role: "member" })
  return (await loadTeam(admin, userId))!
}

/** Remove a member (owner only) or leave the team (self). */
export async function removeMember(
  admin: SupabaseClient,
  userId: string,
  targetUserId: string,
): Promise<void> {
  const membership = await getMembership(admin, userId)
  if (!membership) throw new OrgError("Not in a team.", "NO_ORG", 404)

  const isSelf = targetUserId === userId
  if (!isSelf && membership.role !== "owner") {
    throw new OrgError("Only the owner can remove members.", "FORBIDDEN", 403)
  }
  if (isSelf && membership.role === "owner") {
    throw new OrgError(
      "Owners can't leave their own team. Delete it instead.",
      "OWNER_CANNOT_LEAVE",
    )
  }
  await admin
    .from("organization_members")
    .delete()
    .eq("org_id", membership.org_id)
    .eq("user_id", targetUserId)
}
