"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppState } from "@/context/AppStateContext"
import BrandLogo from "@/components/BrandLogo"

export default function OnboardingPage() {
  const { state, isLoading, createOrganization } = useAppState()
  const router = useRouter()
  const [organizationName, setOrganizationName] = useState("")
  const [workspaceName, setWorkspaceName] = useState("Main Workspace")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!state.currentUser) {
      router.replace("/login")
    } else if (state.activeWorkspaceId) {
      router.replace("/dashboard")
    }
  }, [state.currentUser, state.activeWorkspaceId, isLoading, router])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)
    try {
      await createOrganization(organizationName.trim(), workspaceName.trim())
      router.replace("/dashboard")
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create the organization.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !state.currentUser || state.activeWorkspaceId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Preparing your organization setup...
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg space-y-6 rounded-lg border border-border bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center space-y-2 text-center">
          <BrandLogo className="h-16 w-auto" />
          <h1 className="text-2xl font-bold text-foreground">Set up your organization</h1>
          <p className="text-sm text-muted-foreground">
            Your account is ready. Create an organization and its first workspace to continue.
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organization name</span>
            <input
              autoComplete="organization"
              maxLength={100}
              minLength={2}
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First workspace</span>
            <input
              maxLength={100}
              minLength={2}
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? "Creating workspace..." : "Create organization"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Signed in as {state.currentUser.email}
        </p>
      </div>
    </div>
  )
}
