"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import BrandLogo from "@/components/BrandLogo"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    if (password.length < 8) {
      setError("Password must contain at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.")
      return
    }

    const client = createClient()
    if (!client) {
      setError("Supabase is not configured for this deployment.")
      return
    }
    setIsSubmitting(true)
    try {
      const { error: updateError } = await client.auth.updateUser({ password })
      if (updateError) throw updateError
      router.replace("/dashboard")
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update the password.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center space-y-2 text-center">
          <BrandLogo className="h-16 w-auto" />
          <h1 className="text-2xl font-bold text-foreground">Choose a new password</h1>
        </div>
        {error && <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
            <span className="uppercase tracking-wider">New password</span>
            <input type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground" />
          </label>
          <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
            <span className="uppercase tracking-wider">Confirm password</span>
            <input type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground" />
          </label>
          <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {isSubmitting ? "Updating password..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  )
}
