"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAppState } from "@/context/AppStateContext"
import BrandLogo from "@/components/BrandLogo"
import { Mail, Lock, UserRound } from "lucide-react"

export default function SignupPage() {
  const { state, signUp, isLoading: isCheckingSession, isConfigured } = useAppState()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isCheckingSession && state.currentUser) {
      router.replace(state.activeWorkspaceId ? "/dashboard" : "/onboarding")
    }
  }, [state.currentUser, state.activeWorkspaceId, isCheckingSession, router])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setMessage("")

    const trimmedName = name.trim()
    if (trimmedName.length < 2 || trimmedName.length > 80) {
      setError("Name must contain between 2 and 80 characters.")
      return
    }
    if (password.length < 8) {
      setError("Password must contain at least 8 characters.")
      return
    }

    setIsSubmitting(true)
    try {
      const needsEmailConfirmation = await signUp(trimmedName, email.trim().toLowerCase(), password)
      if (needsEmailConfirmation) {
        setMessage("Check your email to confirm your account. The confirmation link will continue to organization setup.")
      } else {
        router.replace("/onboarding")
      }
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : "Unable to create your account.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center space-y-2 text-center">
          <BrandLogo className="h-16 w-auto" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground">Start a secure BrandSpire workspace.</p>
        </div>

        {error && (
          <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {message && (
          <div role="status" className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-foreground">
            {message}
          </div>
        )}
        {!isConfigured && (
          <div role="alert" className="rounded-md border border-amber-500/30 bg-amber-500/15 p-3 text-sm text-amber-700">
            Supabase is not configured for this deployment.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full name</span>
            <span className="relative block">
              <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                autoComplete="name"
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-md border border-border bg-secondary/50 py-2.5 pl-10 pr-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </span>
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</span>
            <span className="relative block">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                autoComplete="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-border bg-secondary/50 py-2.5 pl-10 pr-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </span>
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</span>
            <span className="relative block">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                autoComplete="new-password"
                minLength={8}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border border-border bg-secondary/50 py-2.5 pl-10 pr-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </span>
          </label>

          <button
            type="submit"
            disabled={!isConfigured || isCheckingSession || isSubmitting}
            className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
