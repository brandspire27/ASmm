"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppState } from "@/context/AppStateContext"
import { Lock, Mail, ShieldAlert, Sparkles } from "lucide-react"

export default function LoginPage() {
  const { state, login, isLoading: isCheckingSession, isConfigured, connectionError } = useAppState()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isCheckingSession && state.currentUser) {
      router.push("/dashboard")
    }
  }, [state.currentUser, isCheckingSession, router])

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
      await login(email, password)
      router.push("/dashboard")
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AgencyOS Lite</h1>
          <p className="text-sm text-muted-foreground">
            Internal AI Marketing Agency Operating System
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
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20">
              <ShieldAlert className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Agency Email Address
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
              Secret Key
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
        </form>

        <div className="border-t border-border pt-4 text-center">
          <p className="text-xs text-muted-foreground font-mono">
            Use the account created for you by your agency admin.
          </p>
        </div>
      </div>
    </div>
  )
}
