"use client"

import React, { useMemo, useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { useAppState } from "@/context/AppStateContext"

export default function WorkspacesPage() {
  const { state, createOrganization, createWorkspace, inviteWorkspaceMember, switchWorkspace } = useAppState()
  const [organizationName, setOrganizationName] = useState("")
  const [firstWorkspaceName, setFirstWorkspaceName] = useState("Main Workspace")
  const [workspaceName, setWorkspaceName] = useState("")
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("content_creator")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isSavingOrganization, setIsSavingOrganization] = useState(false)
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const activeWorkspace = state.workspaces.find((workspace) => workspace.workspaceId === state.activeWorkspaceId)
  const canCreateWorkspace = ["workspace_owner", "workspace_admin"].includes(state.activeRole ?? "")
  const canInviteMembers = ["workspace_owner", "workspace_admin"].includes(state.activeRole ?? "")
  const organizations = useMemo(() => {
    const seen = new Set<string>()
    return state.workspaces.filter((workspace) => {
      if (seen.has(workspace.organizationId)) return false
      seen.add(workspace.organizationId)
      return true
    })
  }, [state.workspaces])

  const handleCreateOrganization = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage("")
    setError("")
    setIsSavingOrganization(true)
    try {
      await createOrganization(organizationName.trim(), firstWorkspaceName.trim())
      setOrganizationName("")
      setFirstWorkspaceName("Main Workspace")
      setMessage("Organization and its first workspace were created.")
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create the organization.")
    } finally {
      setIsSavingOrganization(false)
    }
  }

  const handleCreateWorkspace = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!activeWorkspace) return
    setMessage("")
    setError("")
    setIsSavingWorkspace(true)
    try {
      await createWorkspace(activeWorkspace.organizationId, workspaceName.trim(), timezone)
      setWorkspaceName("")
      setMessage("Workspace created and selected.")
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create the workspace.")
    } finally {
      setIsSavingWorkspace(false)
    }
  }

  const handleSelectWorkspace = async (workspaceId: string) => {
    setMessage("")
    setError("")
    try {
      await switchWorkspace(workspaceId)
      setMessage("Active workspace changed.")
    } catch (switchError) {
      setError(switchError instanceof Error ? switchError.message : "Unable to switch workspace.")
    }
  }

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage("")
    setError("")
    setIsInviting(true)
    try {
      setMessage(await inviteWorkspaceMember(inviteEmail.trim(), inviteRole))
      setInviteEmail("")
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Unable to send the invitation.")
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Organizations & Workspaces</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep teams and client data separated by organization and workspace.
          </p>
        </div>

        {message && <div role="status" className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-500">{message}</div>}
        {error && <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <section className="space-y-4 rounded-lg border border-border bg-card p-6">
          <div>
            <h3 className="font-semibold text-foreground">Your workspaces</h3>
            <p className="mt-1 text-xs text-muted-foreground">Switching workspaces reloads data under that workspace&apos;s database permissions.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {state.workspaces.map((workspace) => (
              <button
                key={workspace.workspaceId}
                type="button"
                onClick={() => void handleSelectWorkspace(workspace.workspaceId)}
                className={`rounded-md border p-4 text-left transition ${
                  workspace.workspaceId === state.activeWorkspaceId
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary/20 hover:border-primary/50"
                }`}
              >
                <span className="block text-sm font-semibold text-foreground">{workspace.workspaceName}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{workspace.organizationName}</span>
                <span className="mt-2 inline-block rounded bg-secondary px-2 py-1 text-[10px] capitalize text-muted-foreground">
                  {workspace.roleKey.replaceAll("_", " ")}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleCreateOrganization} className="space-y-4 rounded-lg border border-border bg-card p-6">
            <div>
              <h3 className="font-semibold text-foreground">Create organization</h3>
              <p className="mt-1 text-xs text-muted-foreground">Creates an isolated organization and its first workspace.</p>
            </div>
            <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
              <span className="uppercase tracking-wider">Organization name</span>
              <input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} minLength={2} maxLength={100} required className="w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground" />
            </label>
            <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
              <span className="uppercase tracking-wider">First workspace name</span>
              <input value={firstWorkspaceName} onChange={(event) => setFirstWorkspaceName(event.target.value)} minLength={2} maxLength={100} required className="w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground" />
            </label>
            <button type="submit" disabled={isSavingOrganization} className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isSavingOrganization ? "Creating..." : "Create organization"}
            </button>
          </form>

          <form onSubmit={handleCreateWorkspace} className="space-y-4 rounded-lg border border-border bg-card p-6">
            <div>
              <h3 className="font-semibold text-foreground">Create workspace</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {activeWorkspace ? `Organization: ${activeWorkspace.organizationName}` : "Select an organization first."}
              </p>
            </div>
            <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
              <span className="uppercase tracking-wider">Workspace name</span>
              <input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} minLength={2} maxLength={100} required className="w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground" />
            </label>
            <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
              <span className="uppercase tracking-wider">Timezone</span>
              <input value={timezone} onChange={(event) => setTimezone(event.target.value)} maxLength={100} required placeholder="Asia/Kolkata" className="w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground" />
            </label>
            <button type="submit" disabled={!canCreateWorkspace || !activeWorkspace || isSavingWorkspace} className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isSavingWorkspace ? "Creating..." : "Create workspace"}
            </button>
            {!canCreateWorkspace && (
              <p className="text-xs text-muted-foreground">Workspace creation is limited to workspace owners and administrators.</p>
            )}
          </form>
        </section>

        {canInviteMembers && activeWorkspace && (
          <form onSubmit={handleInvite} className="space-y-4 rounded-lg border border-border bg-card p-6">
            <div>
              <h3 className="font-semibold text-foreground">Invite a team member</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                The invitation grants access only to {activeWorkspace.workspaceName}.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
                <span className="uppercase tracking-wider">Email address</span>
                <input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} required className="w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground" />
              </label>
              <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
                <span className="uppercase tracking-wider">Workspace role</span>
                <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)} className="w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground">
                  <option value="workspace_admin">Workspace administrator</option>
                  <option value="social_media_manager">Social media manager</option>
                  <option value="content_creator">Content creator</option>
                  <option value="designer">Designer</option>
                  <option value="content_approver">Content approver</option>
                  <option value="analyst">Analyst</option>
                  <option value="viewer">Viewer</option>
                  <option value="client">Client</option>
                </select>
              </label>
            </div>
            <button type="submit" disabled={isInviting} className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isInviting ? "Sending invitation..." : "Send invitation"}
            </button>
          </form>
        )}

        {organizations.length > 0 && (
          <p className="text-xs text-muted-foreground">
            You belong to {organizations.length} organization{organizations.length === 1 ? "" : "s"}.
          </p>
        )}
      </div>
    </DashboardLayout>
  )
}
