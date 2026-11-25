"use client"

import React, { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAppState } from "@/context/AppStateContext"
import BrandLogo from "@/components/BrandLogo"
import { Lock, Mail, ShieldAlert } from "lucide-react"

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Loading sign-in...</div>}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const { state, login, signInWithGoogle, isLoading: isCheckingSession, isConfigured, connectionError } = useAppState()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const callbackError = searchParams.get("error")
  const callbackErrorMessage = callbackError === "invitation_acceptance"
    ? "Sign-in succeeded, but the workspace invitation could not be accepted. Contact your workspace administrator."
    : callbackError === "auth_callback"
      ? "This sign-in link is invalid or expired. Request a new link and try again."
      : callbackError === "supabase_not_configured"
        ? "Supabase authentication is not configured for this deployment."
        : ""
  const displayedError = error || callbackErrorMessage

  useEffect(() => {
    if (!isCheckingSession && state.currentUser) {
      router.push(state.activeWorkspaceId ? "/dashboard" : "/onboarding")
    }
  }, [state.currentUser, state.activeWorkspaceId, isCheckingSession, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email || !password) {
      setError("Please fill out all credentials.")
      setIsLoading(false)
      return
    }

    try {
      const needsOrganization = await login(email, password)
      router.push(needsOrganization ? "/onboarding" : "/dashboard")
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setIsGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Unable to start Google sign-in.")
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center text-center space-y-2">
          <BrandLogo className="h-16 w-auto" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">BrandSpire Social AI</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered social media workspace for your team
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isConfigured && (
            <div className="rounded-md bg-amber-500/15 p-3 text-sm text-amber-700 border border-amber-500/30">
              Supabase is not configured. Add the project URL and publishable key to the deployment environment.
            </div>
          )}
          {connectionError && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20">
              {connectionError}
            </div>
          )}
          {displayedError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20">
              <ShieldAlert className="h-4 w-4" />
              <span>{displayedError}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="architect@agency.internal"
                className="w-full rounded-md border border-border bg-secondary/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-border bg-secondary/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isCheckingSession || !isConfigured}
            className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
          <div className="text-right">
            <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="text-center text-xs text-muted-foreground">or continue with</div>
          <button
            type="button"
            onClick={() => void handleGoogleSignIn()}
            disabled={isGoogleLoading || isCheckingSession || !isConfigured}
            className="w-full rounded-md border border-border py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary/50 disabled:opacity-50"
          >
            {isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}
          </button>
        </form>

        <div className="border-t border-border pt-4 text-center">
          <p className="text-xs text-muted-foreground font-mono">
            New to BrandSpire?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
