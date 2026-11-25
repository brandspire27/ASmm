"use client"

import React, { useState } from "react"
import Link from "next/link"
import BrandLogo from "@/components/BrandLogo"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage("")
    setError("")
    const client = createClient()
    if (!client) {
      setError("Supabase is not configured for this deployment.")
      return
    }

    setIsSubmitting(true)
    try {
      const { error: resetError } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`
      })
      if (resetError) throw resetError
      setMessage("If an account exists for that email, a password reset link has been sent.")
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Unable to request a password reset.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center space-y-2 text-center">
          <BrandLogo className="h-16 w-auto" />
          <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
          <p className="text-sm text-muted-foreground">We&apos;ll email you a secure password reset link.</p>
        </div>
        {message && <div role="status" className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-foreground">{message}</div>}
        {error && <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
            <span className="uppercase tracking-wider">Email address</span>
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground" />
          </label>
          <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {isSubmitting ? "Sending link..." : "Send reset link"}
          </button>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
