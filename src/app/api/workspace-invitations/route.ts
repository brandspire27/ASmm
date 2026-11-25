import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"

const invitationSchema = z.object({
  workspaceId: z.string().uuid(),
  email: z.string().email().max(254),
  roleKey: z.enum([
    "workspace_admin",
    "social_media_manager",
    "content_creator",
    "designer",
    "content_approver",
    "analyst",
    "viewer",
    "client"
  ])
})

export async function POST(request: Request) {
  const requestOrigin = new URL(request.url).origin
  if (request.headers.get("origin") !== requestOrigin) {
    return Response.json({ error: "Invitation requests must come from this application." }, { status: 403 })
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return Response.json({ error: "Supabase authentication is not configured on the server." }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 })
  }

  const parsed = invitationSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "Provide a valid workspace, email address, and workspace role." }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: "Sign in before inviting workspace members." }, { status: 401 })
  }

  const { data: canInvite, error: permissionError } = await supabase.rpc("has_workspace_permission", {
    target_workspace_id: parsed.data.workspaceId,
    required_permission: "workspace.manage_members"
  })
  if (permissionError) {
    return Response.json({ error: `Unable to verify workspace permissions: ${permissionError.message}` }, { status: 500 })
  }
  if (!canInvite) {
    return Response.json({ error: "You do not have permission to invite members to this workspace." }, { status: 403 })
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("organization_id")
    .eq("id", parsed.data.workspaceId)
    .maybeSingle()
  if (workspaceError) {
    return Response.json({ error: `Unable to load the workspace: ${workspaceError.message}` }, { status: 500 })
  }
  if (!workspace) {
    return Response.json({ error: "The workspace does not exist or is not accessible." }, { status: 404 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "Workspace invitations are not configured on the server." }, { status: 503 })
  }

  const adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  const email = parsed.data.email.trim().toLowerCase()
  const { data: existingInvitation, error: lookupError } = await adminClient
    .from("workspace_invitations")
    .select("id, status, expires_at")
    .eq("workspace_id", parsed.data.workspaceId)
    .eq("email", email)
    .maybeSingle()
  if (lookupError) {
    return Response.json({ error: `Unable to check for an existing invitation: ${lookupError.message}` }, { status: 500 })
  }
  if (existingInvitation?.status === "accepted") {
    return Response.json({ error: "This account has already accepted an invitation to the workspace." }, { status: 409 })
  }
  if (
    existingInvitation?.status === "pending" &&
    new Date(existingInvitation.expires_at).getTime() > Date.now()
  ) {
    return Response.json({ error: "A current invitation already exists for this email address." }, { status: 409 })
  }

  const invitationRecord = {
    workspace_id: parsed.data.workspaceId,
    email,
    role_key: parsed.data.roleKey,
    invited_by: user.id,
    status: "pending",
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  } as const
  const { error: recordError } = existingInvitation
    ? await adminClient
        .from("workspace_invitations")
        .update(invitationRecord)
        .eq("id", existingInvitation.id)
    : await adminClient.from("workspace_invitations").insert(invitationRecord)
  if (recordError) {
    return Response.json({ error: `Unable to create the invitation: ${recordError.message}` }, { status: 500 })
  }

  const callbackUrl = new URL("/auth/callback?next=/onboarding", request.url).toString()
  const { error: sendError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: callbackUrl
  })
  if (sendError) {
    const { error: revokeError } = await adminClient
      .from("workspace_invitations")
      .update({ status: "revoked" })
      .eq("workspace_id", parsed.data.workspaceId)
      .eq("email", email)
    if (revokeError) {
      return Response.json({
        error: `The invitation email could not be sent (${sendError.message}), and its pending record could not be revoked (${revokeError.message}).`
      }, { status: 500 })
    }
    return Response.json({ error: `Supabase could not send the invitation: ${sendError.message}` }, { status: 409 })
  }

  return Response.json({ message: `Invitation sent to ${email}.` }, { status: 201 })
}
